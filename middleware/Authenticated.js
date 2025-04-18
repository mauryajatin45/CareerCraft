function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); 
    }
    res.redirect('/login');
}
module.exports = isAuthenticated;
// This middleware checks if the user is authenticated. If they are, it calls the next middleware or route handler. If not, it redirects them to the login page.