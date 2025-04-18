const express = require("express");
const router = express.Router();
const isAuthenticated  = require('../middleware/Authenticated');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require("../models/User");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Career-related keywords in multiple languages
const careerKeywords = {
  en: ["career", "job", "interview", "resume", "cv", "roadmap", "skills"],
  hi: ["करियर", "नौकरी", "इंटरव्यू", "रिज्यूम", "सीवी", "रोडमैप", "कौशल"],
  gu: ["કરિયર", "નોકરી", "ઇન્ટરવ્યુ", "રેઝ્યુમે", "સીવી", "રોડમેપ", "કુશળતા"],
  mr: ["करिअर", "नोकरी", "मुलाखत", "रिझ्युमे", "सीव्ही", "रोडमॅप", "कौशल्ये"],
  bho: ["करियर", "नोकरी", "इंटरव्यू", "रिज्यूम", "सीवी", "रोडमैप", "कौशल"],
  np: ["क्यारियर", "जागिर", "अन्तर्वार्ता", "बायोडाटा", "सिभी", "रोडम्याप", "सिप"]
};

// Field-specific keywords in multiple languages
const fieldKeywords = {
  programming: {
    en: ["programming", "coding", "developer", "software"],
    hi: ["प्रोग्रामिंग", "कोडिंग", "डेवलपर", "सॉफ्टवेयर"],
    gu: ["પ્રોગ્રામિંગ", "કોડિંગ", "ડેવલપર", "સોફ્ટવેર"],
    mr: ["प्रोग्रामिंग", "कोडिंग", "डेव्हलपर", "सॉफ्टवेअर"],
    bho: ["प्रोग्रामिंग", "कोडिंग", "डेवलपर", "सॉफ्टवेयर"],
    np: ["प्रोग्रामिङ", "कोडिङ", "डेभलपर", "सफ्टवेयर"]
  },
  design: {
    en: ["design", "ui", "ux", "graphic"],
    hi: ["डिजाइन", "यूआई", "यूएक्स", "ग्राफिक"],
    gu: ["ડિઝાઇન", "યુઆઇ", "યુએક્સ", "ગ્રાફિક"],
    mr: ["डिझाइन", "यूआय", "यूएक्स", "ग्राफिक"],
    bho: ["डिजाइन", "यूआई", "यूएक्स", "ग्राफिक"],
    np: ["डिजाइन", "यूआई", "यूएक्स", "ग्राफिक"]
  }
};

router.post("/chat", isAuthenticated, async (req, res) => {
  try {
    const userMessage = req.body.message.toLowerCase();
    const selectedLanguage = req.body.language || "en";

    // Check if message is career-related in the selected language
    const isCareerRelated = 
      careerKeywords[selectedLanguage].some(keyword => 
        userMessage.includes(keyword)
      ) || 
      Object.values(fieldKeywords).some(field => 
        field[selectedLanguage].some(term => 
          userMessage.includes(term))
      );

    const languageResponses = {
      en: "I specialize in career guidance. Please ask me about career paths, interview preparation, resume building, or skill development.",
      hi: "मैं करियर मार्गदर्शन में विशेषज्ञ हूँ। कृपया मुझसे करियर पथ, साक्षात्कार तैयारी, रिज्यूम निर्माण, या कौशल विकास के बारे में पूछें।",
      gu: "હું કારકિર્દી માર્ગદર્શનમાં વિશેષજ્ઞ છું. કૃપા કરીને મને કારકિર્દી માર્ગ, ઇન્ટરવ્યુ તૈયારી, રેઝ્યુમ બિલ્ડિંગ અથવા કુશળતા વિકાસ વિશે પૂછો.",
      mr: "मी करिअर मार्गदर्शनात तज्ञ आहे. कृपया मला करिअर मार्ग, मुलाखत तयारी, रिझ्युमे तयार करणे किंवा कौशल्य विकासाबद्दल विचारा.",
      bho: "हम करियर मार्गदर्शन में माहिर बाड़ी। कृपया हमसे करियर पथ, इंटरव्यू तैयारी, रिज्यूम निर्माण, या कौशल विकास के बारे में पूछीं।",
      np: "म करियर मार्गदर्शनमा विशेषज्ञ हुँ। कृपया मलाई करियर पथ, अन्तर्वार्ता तयारी, बायोडाटा निर्माण, वा सिप विकासको बारेमा सोध्नुहोस्।"
    };

    if (!isCareerRelated) {
      return res.json({ 
        response: languageResponses[selectedLanguage] 
      });
    }

    // Enhanced prompt for career guidance in selected language
    const promptTemplates = {
      en: `Provide detailed career guidance in English about "{query}". Include:
      1. Step-by-step roadmap
      2. Learning resources (free/paid)
      3. Required skills
      4. Interview tips if relevant
      5. Resume advice if relevant
      Use clear headings and bullet points.`,
      
      hi: `"{query}" के बारे में हिंदी में विस्तृत करियर मार्गदर्शन प्रदान करें। शामिल करें:
      1. चरण-दर-चरण रोडमैप
      2. सीखने के संसाधन (मुफ्त/भुगतान)
      3. आवश्यक कौशल
      4. यदि प्रासंगिक हो तो साक्षात्कार युक्तियाँ
      5. यदि प्रासंगिक हो तो रिज्यूम सलाह
      स्पष्ट शीर्षक और बुलेट पॉइंट का उपयोग करें।`,
      
      gu: `"{query}" વિશે ગુજરાતીમાં વિસ્તૃત કારકિર્દી માર્ગદર્શન આપો. શામેલ કરો:
      1. પગલું-દર-પગલું રોડમેપ
      2. શીખવાના સાધનો (મફત/ચૂકવણી)
      3. જરૂરી કુશળતા
      4. જો સંબંધિત હોય તો ઇન્ટરવ્યુ ટીપ્સ
      5. જો સંબંધિત હોય તો રેઝ્યુમ સલાહ
      સ્પષ્ટ શીર્ષકો અને બુલેટ પોઇન્ટ્સનો ઉપયોગ કરો.`,
      
      mr: `"{query}" बद्दल मराठीत तपशीलवार करिअर मार्गदर्शन द्या. समाविष्ट करा:
      1. चरण-दर-चरण रोडमॅप
      2. शिकण्याची साधने (विनामूल्य/पैसे देऊन)
      3. आवश्यक कौशल्ये
      4. संबंधित असल्यास मुलाखत टिपा
      5. संबंधित असल्यास रिझ्युमे सल्ला
      स्पष्ट शीर्षके आणि बुलेट पॉइंट्स वापरा.`,
      
      bho: `"{query}" के बारे में भोजपुरी में विस्तृत करियर मार्गदर्शन दीं। शामिल करीं:
      1. कदम-दर-कदम रोडमैप
      2. सीखे के संसाधन (मुफ्त/पैसा दे के)
      3. जरूरी कौशल
      4. अगर लागू हो त इंटरव्यू टिप्स
      5. अगर लागू हो त रिज्यूम सलाह
      साफ-साफ हेडिंग आ बुलेट पॉइंट इस्तेमाल करीं।`,
      
      np: `"{query}" को बारेमा नेपालीमा विस्तृत करियर मार्गदर्शन प्रदान गर्नुहोस्। समावेश गर्नुहोस्:
      1. चरण-दर-चरण रोडम्याप
      2. सिक्ने स्रोतहरू (निःशुल्क/पैसा तिरेर)
      3. आवश्यक सिपहरू
      4. सम्बन्धित भए अन्तर्वार्ता सुझावहरू
      5. सम्बन्धित भए बायोडाटा सल्लाहहरू
      स्पष्ट शीर्षकहरू र बुलेट प्वाइन्टहरू प्रयोग गर्नुहोस्।`
    };

    const prompt = promptTemplates[selectedLanguage].replace("{query}", req.body.message);

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Format the response for better readability
    const formattedResponse = response
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/- (.*?)(<br>|$)/g, '• $1<br>');

    res.json({ response: formattedResponse });

  } catch (error) {
    console.error("Error generating AI response:", error);
    const errorResponses = {
      en: "I'm having trouble providing career guidance. Please try again later.",
      hi: "मुझे करियर मार्गदर्शन प्रदान करने में समस्या हो रही है। कृपया बाद में पुनः प्रयास करें।",
      gu: "મને કારકિર્દી માર્ગદર્શન આપવામાં સમસ્યા થઈ રહી છે. કૃપા કરીને પછીથી ફરીથી પ્રયાસ કરો.",
      mr: "मला करिअर मार्गदर्शन देण्यात अडचण येत आहे. कृपया नंतर पुन्हा प्रयत्न करा.",
      bho: "हमके करियर मार्गदर्शन दे में दिक्कत हो रहल बा। कृपया बाद में फिर से कोसिस करीं।",
      np: "मलाई करियर मार्गदर्शन प्रदान गर्न समस्या भइरहेको छ। कृपया पछि फेरि प्रयास गर्नुहोस्।"
    };
    
    res.json({ 
      response: errorResponses[req.body.language || "en"] 
    });
  }
});

module.exports = router;