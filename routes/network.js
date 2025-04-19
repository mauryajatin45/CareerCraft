require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAuthenticated  = require('../middleware/Authenticated');

// Get Twitter token from environment variables
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

const DEBUG_MODE = true;


// Searches recent tweets for a given keyword (language/skill) and fetches user details
async function searchTwitter(language) {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(language + ' -is:retweet lang:en')}&tweet.fields=author_id`;
    const headers = { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` };

    try {
        const response = await axios.get(url, { headers });
        console.log('Twitter raw tweet response:', response.data);
        const tweets = response.data.data || [];
        const authorIds = tweets.map(tweet => tweet.author_id);

        if (authorIds.length === 0) {
            console.log(`No tweets found for ${language}`);
            if (DEBUG_MODE) {
                // Return sample data for testing front-end rendering
                return [{
                    name: 'Jane Developer',
                    username: 'janedeveloper',
                    profileUrl: 'https://twitter.com/janedeveloper',
                    profileImage: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
                    source: 'twitter'
                }];
            }
            return [];
        }
        
        const userDetails = await getUserDetailsByAuthorId(authorIds);
        console.log('Twitter user details:', userDetails);

        return userDetails.map(user => ({
            name: user.name,
            username: user.username,
            profileUrl: `https://twitter.com/${user.username}`,
            profileImage: user.profile_image_url,
            source: 'twitter'
        }));
    } catch (error) {
        console.error('Twitter API error:', error.response?.data || error.message);
        return [];
    }
}

// Fetches Twitter user details for a list of author IDs
async function getUserDetailsByAuthorId(authorIds) {
    const url = `https://api.twitter.com/2/users?ids=${authorIds.join(',')}&user.fields=username,profile_image_url,name`;
    const headers = { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` };

    try {
        const response = await axios.get(url, { headers });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching user details:', error.response?.data || error.message);
        return [];
    }
}

// Render the search form page
router.get('/network', isAuthenticated, (req, res) => {
    res.render('network-search'); // This view should include your search form
});

// Combined Search Route using Twitter/X only
router.get('/find-connections', isAuthenticated, async (req, res) => {
    const { language } = req.query;
    if (!language) return res.status(400).send('Missing programming language.');

    try {
        const twitterResults = await searchTwitter(language);

        if (twitterResults.length === 0) {
            return res.render('network', { matches: [], language, message: 'No connections found for this skill.' });
        }

        res.render('network', { matches: twitterResults, language });
    } catch (error) {
        console.error('Error fetching connections:', error.message);
        return res.status(500).send('Error fetching connections');
    }
});

// Export the router
module.exports = {router};