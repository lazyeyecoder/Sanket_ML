export type Language = "en" | "hi" | "mr";

export const languages: { id: Language; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "mr", label: "Marathi", native: "मराठी" },
];

// expo-speech locales per app language (see src/lib/speech.ts for the
// fallback chain when a voice isn't installed on the device).
export const speechLocales: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

const strings = {
  en: {
    profile: "Profile",
    language: "Language",
    signOut: "Sign Out",
    role: "Role",

    // capture
    photographBurn: "Photograph the Burn",
    photographWound: "Photograph the Wound",
    captureSubtitle: "Get the injury clearly in frame, with good light if possible.",
    noPhotoYet: "No photo yet",
    analyzing: "Analyzing…",
    takePhoto: "📷 Take Photo",
    chooseGallery: "Choose from Gallery",
    errCameraPermission:
      "Camera permission is needed to take a photo. You can still choose one from your gallery.",
    errLibraryPermission: "Photo library permission is needed to choose an image.",
    errReadImage: "Couldn't read that image. Please try again.",

    // result
    visualResult: "Visual Result",
    detected: "DETECTED",
    modelConfidence: "Model confidence",
    confidenceNote:
      "This reflects how sure the model is about what it sees — not how medically severe the injury is.",
    noDetectionTitle: "No confident detection",
    noDetectionBody:
      "The model didn't find a clear match in this photo. You can retake it with better lighting/framing, or continue to general first-aid guidance below.",
    urgencyHigh: "IMMEDIATE HELP NEEDED",
    urgencyMedium: "EXTRA CAUTION NEEDED",
    urgencyLow: "LOWER CONCERN FROM PHOTO",
    urgencyUnknown: "URGENCY NOT DETERMINED",
    disclaimerDefault:
      "A single photo can't determine complete medical severity. When in doubt, seek professional medical help.",
    quickQuestions: "A couple of quick questions",
    yes: "Yes",
    no: "No",
    haveKit: "Do you have a first-aid kit?",
    noKit: "No / Not sure",
    getInstructions: "Get First-Aid Instructions",
    gettingInstructions: "Getting instructions…",
    retake: "Retake Photo",
    detectedOnDevice: "Detected on this phone — works without internet",
    detectedOnServer: "Detected by the SANKET server",
    errGuidanceOffline:
      "Can't reach the SANKET server, so step-by-step guidance isn't available right now. If this is an emergency, call your local emergency number or get professional medical help now.",

    // first-aid
    bannerSourced: "SOURCE-CITED STEPS",
    bannerCaution: "CAUTION",
    bannerStatic: "FIRST-AID STEPS",
    redFlags: "⚠ Red flags",
    play: "▶ Play",
    playing: "🔊 Playing…",
    source: "Source",
    noGuidance:
      "Not enough verified local guidance was found for this. Please seek professional medical help.",
    voiceFallbackNote:
      "A voice for your language isn't installed on this device, so the audio may sound different.",
    viewOnMap: "View on Map",
    done: "Done",

    // profile: saved reports
    myReports: "My reports",
    noReportsYet: "No reports yet. Photos you analyse are saved here.",
    tapToView: "Tap to view the steps",
    tagHigh: "High urgency",
    tagMedium: "Extra caution",
    tagLow: "Lower concern",
    tagUnknown: "Urgency not determined",
    statusOpen: "Open",
    statusAccepted: "Help accepted",
    statusResolved: "Resolved",
  },
  hi: {
    profile: "प्रोफ़ाइल",
    language: "भाषा",
    signOut: "साइन आउट",
    role: "भूमिका",

    photographBurn: "जले हुए हिस्से की फ़ोटो लें",
    photographWound: "घाव की फ़ोटो लें",
    captureSubtitle: "चोट को फ़्रेम में साफ़ रखें, हो सके तो अच्छी रोशनी में।",
    noPhotoYet: "अभी कोई फ़ोटो नहीं",
    analyzing: "जाँच हो रही है…",
    takePhoto: "📷 फ़ोटो लें",
    chooseGallery: "गैलरी से चुनें",
    errCameraPermission:
      "फ़ोटो लेने के लिए कैमरे की अनुमति चाहिए। आप गैलरी से भी फ़ोटो चुन सकते हैं।",
    errLibraryPermission: "फ़ोटो चुनने के लिए गैलरी की अनुमति चाहिए।",
    errReadImage: "वह फ़ोटो पढ़ी नहीं जा सकी। कृपया दोबारा कोशिश करें।",

    visualResult: "फ़ोटो का नतीजा",
    detected: "पहचाना गया",
    modelConfidence: "मॉडल का विश्वास स्तर",
    confidenceNote:
      "यह बताता है कि मॉडल को अपनी पहचान पर कितना यक़ीन है - चोट कितनी गंभीर है, यह नहीं।",
    noDetectionTitle: "कोई पक्की पहचान नहीं",
    noDetectionBody:
      "मॉडल को इस फ़ोटो में कोई साफ़ मेल नहीं मिला। आप बेहतर रोशनी/फ़्रेमिंग में फ़ोटो दोबारा ले सकते हैं, या नीचे सामान्य प्राथमिक उपचार देख सकते हैं।",
    urgencyHigh: "तुरंत मदद ज़रूरी",
    urgencyMedium: "ज़्यादा सावधानी ज़रूरी",
    urgencyLow: "फ़ोटो देखकर कम चिंता",
    urgencyUnknown: "तात्कालिकता तय नहीं",
    disclaimerDefault:
      "सिर्फ़ एक फ़ोटो से चोट की पूरी गंभीरता तय नहीं हो सकती। संदेह हो तो पेशेवर चिकित्सा सहायता लें।",
    quickQuestions: "कुछ छोटे सवाल",
    yes: "हाँ",
    no: "नहीं",
    haveKit: "क्या आपके पास प्राथमिक उपचार किट है?",
    noKit: "नहीं / पक्का नहीं",
    getInstructions: "प्राथमिक उपचार के निर्देश पाएँ",
    gettingInstructions: "निर्देश लाए जा रहे हैं…",
    retake: "फ़ोटो दोबारा लें",
    detectedOnDevice: "इस फ़ोन पर ही पहचाना गया - बिना इंटरनेट के भी काम करता है",
    detectedOnServer: "SANKET सर्वर द्वारा पहचाना गया",
    errGuidanceOffline:
      "SANKET सर्वर से संपर्क नहीं हो पा रहा, इसलिए अभी कदम-दर-कदम मार्गदर्शन उपलब्ध नहीं है। अगर यह आपातकाल है, तो तुरंत अपने स्थानीय आपातकालीन नंबर पर कॉल करें या पेशेवर चिकित्सा सहायता लें।",

    bannerSourced: "स्रोत सहित कदम",
    bannerCaution: "सावधानी",
    bannerStatic: "प्राथमिक उपचार के कदम",
    redFlags: "⚠ ख़तरे के संकेत",
    play: "▶ सुनें",
    playing: "🔊 चल रहा है…",
    source: "स्रोत",
    noGuidance:
      "इसके लिए पर्याप्त सत्यापित स्थानीय जानकारी नहीं मिली। कृपया पेशेवर चिकित्सा सहायता लें।",
    voiceFallbackNote:
      "आपकी भाषा की आवाज़ इस डिवाइस पर इंस्टॉल नहीं है, इसलिए ऑडियो अलग लग सकता है।",
    viewOnMap: "नक्शे पर देखें",
    done: "हो गया",

    myReports: "मेरी रिपोर्ट",
    noReportsYet: "अभी कोई रिपोर्ट नहीं। आपकी जाँची गई फ़ोटो यहाँ सेव होती हैं।",
    tapToView: "कदम देखने के लिए टैप करें",
    tagHigh: "तुरंत मदद",
    tagMedium: "ज़्यादा सावधानी",
    tagLow: "कम चिंता",
    tagUnknown: "तात्कालिकता तय नहीं",
    statusOpen: "खुली",
    statusAccepted: "मदद स्वीकार की गई",
    statusResolved: "निपटाई गई",
  },
  mr: {
    profile: "प्रोफाइल",
    language: "भाषा",
    signOut: "साइन आउट",
    role: "भूमिका",

    photographBurn: "भाजलेल्या भागाचा फोटो घ्या",
    photographWound: "जखमेचा फोटो घ्या",
    captureSubtitle: "दुखापत फ्रेममध्ये स्पष्ट ठेवा, शक्य असल्यास चांगल्या प्रकाशात.",
    noPhotoYet: "अद्याप फोटो नाही",
    analyzing: "तपासणी सुरू आहे…",
    takePhoto: "📷 फोटो घ्या",
    chooseGallery: "गॅलरीतून निवडा",
    errCameraPermission:
      "फोटो घेण्यासाठी कॅमेऱ्याची परवानगी आवश्यक आहे. तुम्ही गॅलरीतूनही फोटो निवडू शकता.",
    errLibraryPermission: "फोटो निवडण्यासाठी गॅलरीची परवानगी आवश्यक आहे.",
    errReadImage: "तो फोटो वाचता आला नाही. कृपया पुन्हा प्रयत्न करा.",

    visualResult: "फोटोचा निकाल",
    detected: "ओळखले गेले",
    modelConfidence: "मॉडेलचा विश्वास स्तर",
    confidenceNote:
      "हे मॉडेलला स्वतःच्या ओळखीबद्दल किती खात्री आहे ते दर्शवते - दुखापत किती गंभीर आहे ते नाही.",
    noDetectionTitle: "खात्रीशीर ओळख नाही",
    noDetectionBody:
      "मॉडेलला या फोटोमध्ये स्पष्ट जुळणारे काही आढळले नाही. तुम्ही चांगल्या प्रकाशात/फ्रेमिंगमध्ये फोटो पुन्हा काढू शकता, किंवा खालील सामान्य प्रथमोपचार पाहू शकता.",
    urgencyHigh: "तात्काळ मदत आवश्यक",
    urgencyMedium: "जास्त सावधानी आवश्यक",
    urgencyLow: "फोटोवरून कमी काळजी",
    urgencyUnknown: "तातडी ठरवता आली नाही",
    disclaimerDefault:
      "फक्त एका फोटोवरून दुखापतीचे पूर्ण गांभीर्य ठरवता येत नाही. शंका असल्यास व्यावसायिक वैद्यकीय मदत घ्या.",
    quickQuestions: "काही छोटे प्रश्न",
    yes: "हो",
    no: "नाही",
    haveKit: "तुमच्याकडे प्रथमोपचार किट आहे का?",
    noKit: "नाही / खात्री नाही",
    getInstructions: "प्रथमोपचाराच्या सूचना मिळवा",
    gettingInstructions: "सूचना मिळवत आहे…",
    retake: "फोटो पुन्हा काढा",
    detectedOnDevice: "या फोनवरच ओळखले गेले - इंटरनेटशिवायही चालते",
    detectedOnServer: "SANKET सर्व्हरद्वारे ओळखले गेले",
    errGuidanceOffline:
      "SANKET सर्व्हरशी संपर्क होत नाही, त्यामुळे टप्प्याटप्प्याचे मार्गदर्शन सध्या उपलब्ध नाही. हे आणीबाणीचे असेल, तर तात्काळ तुमच्या स्थानिक आपत्कालीन क्रमांकावर कॉल करा किंवा व्यावसायिक वैद्यकीय मदत घ्या.",

    bannerSourced: "स्रोतांसह टप्पे",
    bannerCaution: "सावधानता",
    bannerStatic: "प्रथमोपचाराचे टप्पे",
    redFlags: "⚠ धोक्याची चिन्हे",
    play: "▶ ऐका",
    playing: "🔊 वाजत आहे…",
    source: "स्रोत",
    noGuidance:
      "यासाठी पुरेशी पडताळलेली स्थानिक माहिती सापडली नाही. कृपया व्यावसायिक वैद्यकीय मदत घ्या.",
    voiceFallbackNote:
      "तुमच्या भाषेतील आवाज या डिव्हाइसवर इन्स्टॉल केलेला नाही, त्यामुळे ऑडिओ वेगळा वाटू शकतो.",
    viewOnMap: "नकाशावर पाहा",
    done: "पूर्ण",

    myReports: "माझे अहवाल",
    noReportsYet: "अद्याप अहवाल नाहीत. तुम्ही तपासलेले फोटो येथे जतन होतात.",
    tapToView: "टप्पे पाहण्यासाठी टॅप करा",
    tagHigh: "तात्काळ मदत",
    tagMedium: "जास्त सावधानी",
    tagLow: "कमी काळजी",
    tagUnknown: "तातडी ठरवली नाही",
    statusOpen: "खुला",
    statusAccepted: "मदत स्वीकारली",
    statusResolved: "निकाली",
  },
} as const;

// Display names for the model's class labels (must stay in sync with
// Sanket_ML/labels.py `classes`; the class ids/keys themselves never change).
const classNames: Record<Language, Record<string, string>> = {
  en: {
    first_degree_burn: "First-Degree Burn",
    second_degree_burn: "Second-Degree Burn",
    third_degree_burn: "Third-Degree Burn",
    Abrasion_Wound: "Abrasion (Scrape)",
    Bruises_Wound: "Bruise",
    Brun_Wound: "Burn",
    Cut_Wound: "Cut",
    Diabetic_Wound: "Diabetic Wound",
    Laseration_Wound: "Laceration (Deep Cut)",
    Normal: "No wound",
    Pressure_Wound: "Pressure Sore",
    Surgical_Wound: "Surgical Wound",
    Venous_Wound: "Venous (Leg) Ulcer",
  },
  hi: {
    first_degree_burn: "पहली डिग्री का जलना",
    second_degree_burn: "दूसरी डिग्री का जलना",
    third_degree_burn: "तीसरी डिग्री का जलना",
    Abrasion_Wound: "खरोंच (छिलना)",
    Bruises_Wound: "नील / चोट का निशान",
    Brun_Wound: "जलना",
    Cut_Wound: "कट",
    Diabetic_Wound: "मधुमेह का घाव",
    Laseration_Wound: "गहरा कट",
    Normal: "कोई घाव नहीं",
    Pressure_Wound: "दबाव से बना घाव (बेडसोर)",
    Surgical_Wound: "ऑपरेशन का घाव",
    Venous_Wound: "शिरा का (पैर का) अल्सर",
  },
  mr: {
    first_degree_burn: "पहिल्या अंशाचे भाजणे",
    second_degree_burn: "दुसऱ्या अंशाचे भाजणे",
    third_degree_burn: "तिसऱ्या अंशाचे भाजणे",
    Abrasion_Wound: "खरचटणे (ओरखडा)",
    Bruises_Wound: "निळा डाग / मुकामार",
    Brun_Wound: "भाजणे",
    Cut_Wound: "कापणे",
    Diabetic_Wound: "मधुमेहाची जखम",
    Laseration_Wound: "खोल कापणे",
    Normal: "जखम नाही",
    Pressure_Wound: "दाबामुळे झालेले व्रण (बेडसोर)",
    Surgical_Wound: "शस्त्रक्रियेची जखम",
    Venous_Wound: "शिरांमुळे झालेले (पायाचे) व्रण",
  },
};

export function className(language: Language, cls: string): string {
  return classNames[language]?.[cls] ?? classNames.en[cls] ?? cls.replace(/_/g, " ");
}

export type StringKey = keyof (typeof strings)["en"];

export function t(language: Language, key: StringKey): string {
  return strings[language]?.[key] ?? strings.en[key];
}

// Names of the emergency types shown on the Report screen (used as the tag
// for saved reports that have no photo detection, e.g. choking/cardiac).
const emergencyTypeNames: Record<Language, Record<string, string>> = {
  en: {
    injury: "Injury / Fall",
    bleeding: "Bleeding",
    burn: "Burn",
    choking: "Choking",
    cardiac: "Cardiac / Chest Pain",
    general: "Other",
  },
  hi: {
    injury: "चोट / गिरना",
    bleeding: "रक्तस्राव",
    burn: "जलना",
    choking: "दम घुटना",
    cardiac: "हृदय / सीने में दर्द",
    general: "अन्य",
  },
  mr: {
    injury: "दुखापत / पडणे",
    bleeding: "रक्तस्राव",
    burn: "भाजणे",
    choking: "गुदमरणे",
    cardiac: "हृदय / छातीत दुखणे",
    general: "इतर",
  },
};

export function emergencyTypeName(language: Language, type: string): string {
  return emergencyTypeNames[language]?.[type] ?? emergencyTypeNames.en[type] ?? type;
}

export const dateLocales: Record<Language, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
