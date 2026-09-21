"""
Static, localizable strings for the guidance composer, plus how each
model class maps to (a) a display title and (b) the English phrase used
to query the English retrieval index.
"""

# English phrase used for retrieval (the index is English-only; the
# displayed text is localized afterwards). Tuned so a class pulls the
# "what to do" chunks rather than a definition.
CLASS_QUERY = {
    "first_degree_burn": "burn first aid cool the burn",
    "second_degree_burn": "burn first aid cool the burn blisters",
    "third_degree_burn": "serious deep burn emergency first aid",
    "Abrasion_Wound": "abrasion scrape clean the wound",
    "Bruises_Wound": "bruise cold pack rest",
    "Brun_Wound": "burn first aid cool the burn",
    "Cut_Wound": "cut wound clean and stop bleeding",
    "Diabetic_Wound": "diabetic foot ulcer wound care",
    "Laseration_Wound": "deep cut laceration bleeding",
    "Pressure_Wound": "pressure ulcer bed sore care",
    "Surgical_Wound": "surgical wound incision signs of infection",
    "Venous_Wound": "venous leg ulcer care",
}

LABELS = {
    "en": {
        "title_suffix": "First Aid",
        "general_title": "General First Aid",
        "safe_title": "Seek professional medical help",
        "safe_summary": (
            "There isn't enough verified guidance available locally to give "
            "specific first-aid steps for this. Please seek professional "
            "medical help rather than guessing."
        ),
        "safe_summary_no_index": (
            "The local first-aid reference isn't available right now. "
            "Please seek professional medical help."
        ),
        "safe_summary_error": (
            "Something went wrong while preparing guidance. "
            "Please seek professional medical help."
        ),
        "no_wound_title": "No wound detected",
        "no_wound_summary": (
            "The model didn't find a wound in this photo. Retake it closer "
            "and in good light. If someone is hurt, get medical help."
        ),
        "kit_note": (
            "You don't need a first-aid kit for the steps above - use clean "
            "water and the cleanest cloth you have. If a sterile dressing "
            "or gloves happen to be available, use them, but don't wait "
            "for them."
        ),
        "kit_source": "SANKET guidance policy (no-kit mode) - not a medical source",
        "classes": {
            "first_degree_burn": "First-Degree Burn",
            "second_degree_burn": "Second-Degree Burn",
            "third_degree_burn": "Third-Degree Burn",
            "Abrasion_Wound": "Abrasion (Scrape)",
            "Bruises_Wound": "Bruise",
            "Brun_Wound": "Burn",
            "Cut_Wound": "Cut",
            "Diabetic_Wound": "Diabetic Wound",
            "Laseration_Wound": "Laceration (Deep Cut)",
            "Pressure_Wound": "Pressure Sore",
            "Surgical_Wound": "Surgical Wound",
            "Venous_Wound": "Venous (Leg) Ulcer",
        },
    },
    "hi": {
        "title_suffix": "प्राथमिक उपचार",
        "general_title": "सामान्य प्राथमिक उपचार",
        "safe_title": "पेशेवर चिकित्सा सहायता लें",
        "safe_summary": (
            "इस स्थिति के लिए प्राथमिक उपचार के विशिष्ट कदम बताने लायक सत्यापित "
            "जानकारी यहाँ उपलब्ध नहीं है। कृपया अंदाज़ा लगाने के बजाय पेशेवर "
            "चिकित्सा सहायता लें।"
        ),
        "safe_summary_no_index": (
            "स्थानीय प्राथमिक उपचार संदर्भ अभी उपलब्ध नहीं है। "
            "कृपया पेशेवर चिकित्सा सहायता लें।"
        ),
        "safe_summary_error": (
            "मार्गदर्शन तैयार करते समय कुछ गड़बड़ हुई। कृपया पेशेवर चिकित्सा सहायता लें।"
        ),
        "no_wound_title": "कोई घाव नहीं मिला",
        "no_wound_summary": (
            "मॉडल को इस फ़ोटो में कोई घाव नहीं दिखा। फ़ोटो को पास से और अच्छी रोशनी में "
            "दोबारा लें। अगर कोई घायल है, तो चिकित्सा सहायता लें।"
        ),
        "kit_note": (
            "ऊपर के कदमों के लिए प्राथमिक उपचार किट ज़रूरी नहीं है - साफ़ पानी और अपने पास "
            "मौजूद सबसे साफ़ कपड़े का इस्तेमाल करें। अगर स्टेराइल ड्रेसिंग या दस्ताने मिल जाएँ, "
            "तो उनका इस्तेमाल करें, लेकिन उनका इंतज़ार न करें।"
        ),
        "kit_source": "SANKET मार्गदर्शन नीति (बिना किट) - चिकित्सा स्रोत नहीं",
        "classes": {
            "first_degree_burn": "पहली डिग्री का जलना",
            "second_degree_burn": "दूसरी डिग्री का जलना",
            "third_degree_burn": "तीसरी डिग्री का जलना",
            "Abrasion_Wound": "खरोंच (छिलना)",
            "Bruises_Wound": "नील / चोट का निशान",
            "Brun_Wound": "जलना",
            "Cut_Wound": "कट",
            "Diabetic_Wound": "मधुमेह का घाव",
            "Laseration_Wound": "गहरा कट",
            "Pressure_Wound": "दबाव से बना घाव (बेडसोर)",
            "Surgical_Wound": "ऑपरेशन का घाव",
            "Venous_Wound": "शिरा का (पैर का) अल्सर",
        },
    },
    "mr": {
        "title_suffix": "प्रथमोपचार",
        "general_title": "सामान्य प्रथमोपचार",
        "safe_title": "व्यावसायिक वैद्यकीय मदत घ्या",
        "safe_summary": (
            "या परिस्थितीसाठी प्रथमोपचाराचे विशिष्ट टप्पे सांगण्याइतकी पडताळलेली माहिती "
            "येथे उपलब्ध नाही. कृपया अंदाज बांधण्याऐवजी व्यावसायिक वैद्यकीय मदत घ्या."
        ),
        "safe_summary_no_index": (
            "स्थानिक प्रथमोपचार संदर्भ सध्या उपलब्ध नाही. कृपया व्यावसायिक वैद्यकीय मदत घ्या."
        ),
        "safe_summary_error": (
            "मार्गदर्शन तयार करताना काहीतरी चूक झाली. कृपया व्यावसायिक वैद्यकीय मदत घ्या."
        ),
        "no_wound_title": "जखम आढळली नाही",
        "no_wound_summary": (
            "या फोटोमध्ये मॉडेलला जखम दिसली नाही. फोटो जवळून आणि चांगल्या प्रकाशात पुन्हा "
            "काढा. कोणी जखमी असेल, तर वैद्यकीय मदत घ्या."
        ),
        "kit_note": (
            "वरील टप्प्यांसाठी प्रथमोपचार किटची गरज नाही - स्वच्छ पाणी आणि तुमच्याकडील "
            "सर्वात स्वच्छ कापड वापरा. निर्जंतुक ड्रेसिंग किंवा हातमोजे उपलब्ध असतील तर "
            "वापरा, पण त्यांची वाट पाहू नका."
        ),
        "kit_source": "SANKET मार्गदर्शन धोरण (किटशिवाय) - वैद्यकीय स्रोत नाही",
        "classes": {
            "first_degree_burn": "पहिल्या अंशाचे भाजणे",
            "second_degree_burn": "दुसऱ्या अंशाचे भाजणे",
            "third_degree_burn": "तिसऱ्या अंशाचे भाजणे",
            "Abrasion_Wound": "खरचटणे (ओरखडा)",
            "Bruises_Wound": "निळा डाग / मुकामार",
            "Brun_Wound": "भाजणे",
            "Cut_Wound": "कापणे",
            "Diabetic_Wound": "मधुमेहाची जखम",
            "Laseration_Wound": "खोल कापणे",
            "Pressure_Wound": "दाबामुळे झालेले व्रण (बेडसोर)",
            "Surgical_Wound": "शस्त्रक्रियेची जखम",
            "Venous_Wound": "शिरांमुळे झालेले (पायाचे) व्रण",
        },
    },
}


def labels(lang: str) -> dict:
    """Labels for `lang`, falling back to English key-by-key."""
    merged = dict(LABELS["en"])
    merged.update(LABELS.get(lang, {}))
    return merged


# Strings triage.py shows to the user (red flags, disclaimer, follow-up
# questions). `basis` (which rules fired) stays English: it's for
# developers/audit, not shown in the UI.
TRIAGE_LABELS = {
    "en": {
        "red_flag_heavy_bleeding": "Heavy or uncontrolled bleeding reported.",
        "red_flag_unconscious": "Person is not conscious/responsive.",
        "red_flag_breathing": "Breathing is not normal.",
        "disclaimer": (
            "This is a conservative estimate from a single image and a few "
            "questions - it cannot determine complete medical severity. "
            "When in doubt, seek professional medical help."
        ),
        "questions": {
            "heavy_bleeding": "Is there heavy or uncontrolled bleeding?",
            "conscious": "Is the person conscious and responsive?",
            "breathing_normal": "Are they breathing normally?",
            "large_area": "Is the affected area larger than the person's palm?",
            "critical_location": "Is it on the face, neck, joints, hands, or genitals?",
            "cause": "What caused it?",
        },
    },
    "hi": {
        "red_flag_heavy_bleeding": "भारी या बेकाबू रक्तस्राव बताया गया।",
        "red_flag_unconscious": "व्यक्ति बेहोश है या प्रतिक्रिया नहीं दे रहा।",
        "red_flag_breathing": "साँस सामान्य नहीं है।",
        "disclaimer": (
            "यह एक फ़ोटो और कुछ सवालों पर आधारित सतर्क अनुमान है - इससे चोट की पूरी "
            "गंभीरता तय नहीं हो सकती। संदेह हो तो पेशेवर चिकित्सा सहायता लें।"
        ),
        "questions": {
            "heavy_bleeding": "क्या बहुत ज़्यादा या बेकाबू खून बह रहा है?",
            "conscious": "क्या व्यक्ति होश में है और प्रतिक्रिया दे रहा है?",
            "breathing_normal": "क्या वे सामान्य रूप से साँस ले रहे हैं?",
            "large_area": "क्या प्रभावित हिस्सा व्यक्ति की हथेली से बड़ा है?",
            "critical_location": "क्या यह चेहरे, गर्दन, जोड़ों, हाथों या जननांगों पर है?",
            "cause": "यह किस वजह से हुआ?",
        },
    },
    "mr": {
        "red_flag_heavy_bleeding": "जास्त किंवा नियंत्रणाबाहेरचा रक्तस्राव सांगितला.",
        "red_flag_unconscious": "व्यक्ती बेशुद्ध आहे किंवा प्रतिसाद देत नाही.",
        "red_flag_breathing": "श्वास सामान्य नाही.",
        "disclaimer": (
            "हा एका फोटो आणि काही प्रश्नांवर आधारित सावध अंदाज आहे - यावरून दुखापतीचे "
            "पूर्ण गांभीर्य ठरवता येत नाही. शंका असल्यास व्यावसायिक वैद्यकीय मदत घ्या."
        ),
        "questions": {
            "heavy_bleeding": "जास्त किंवा नियंत्रणाबाहेर रक्तस्राव होत आहे का?",
            "conscious": "व्यक्ती शुद्धीवर आहे आणि प्रतिसाद देत आहे का?",
            "breathing_normal": "त्यांचा श्वास सामान्य आहे का?",
            "large_area": "प्रभावित भाग व्यक्तीच्या तळहातापेक्षा मोठा आहे का?",
            "critical_location": "हे चेहरा, मान, सांधे, हात किंवा जननेंद्रियांवर आहे का?",
            "cause": "हे कशामुळे झाले?",
        },
    },
}


def triage_labels(lang: str) -> dict:
    return TRIAGE_LABELS.get(lang, TRIAGE_LABELS["en"])
