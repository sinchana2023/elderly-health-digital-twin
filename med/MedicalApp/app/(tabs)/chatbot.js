import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Medical knowledge base
const medicalKnowledge = {
  temperature: {
    normal: "The normal body temperature is 98.6°F (37°C). However, it can range from 97°F (36.1°C) to 99°F (37.2°C).",
    fever: "A fever is generally considered when body temperature is above 100.4°F (38°C). If persistent, consult a doctor.",
    low: "Body temperature below 95°F (35°C) is considered hypothermia and requires immediate medical attention.",
  },
  bloodPressure: {
    normal: "Normal blood pressure is generally considered to be below 120/80 mmHg.",
    high: "Blood pressure above 130/80 mmHg is considered high (hypertension). Lifestyle changes and medication may be needed.",
    low: "Blood pressure below 90/60 mmHg is considered low (hypotension). This can cause dizziness and fainting.",
    tips: [
      "Maintain a healthy weight",
      "Exercise regularly",
      "Reduce salt intake",
      "Limit alcohol consumption",
      "Manage stress effectively"
    ]
  },
  heartRate: {
    normal: "A normal resting heart rate for adults is between 60-100 beats per minute. Athletes might have lower rates.",
    high: "Heart rate consistently above 100 bpm at rest (tachycardia) should be evaluated by a doctor.",
    low: "Heart rate below 60 bpm (bradycardia) may be concerning unless you're very physically fit."
  },
  weakness: {
    general: [
      "Ensure you're getting enough rest and sleep",
      "Stay hydrated - drink plenty of water",
      "Eat nutritious meals regularly",
      "Consider taking vitamin supplements after consulting your doctor",
      "Avoid overexertion"
    ],
    serious: "If weakness persists for more than a few days or is accompanied by other symptoms, consult a healthcare provider.",
    causes: [
      "Dehydration",
      "Poor nutrition",
      "Lack of sleep",
      "Anemia",
      "Stress or anxiety",
      "Underlying medical conditions"
    ]
  },
  headache: {
    remedies: [
      "Rest in a quiet, dark room",
      "Apply a cold or warm compress",
      "Stay hydrated",
      "Try over-the-counter pain relievers",
      "Practice relaxation techniques"
    ],
    warning: "Seek immediate medical attention if headache is severe or accompanied by confusion, fever, or stiff neck.",
    types: {
      tension: "Often feels like a tight band around the head. Usually caused by stress or muscle tension.",
      migraine: "Severe throbbing pain, often on one side. May include nausea and sensitivity to light/sound.",
      cluster: "Intense pain around one eye. Occurs in clusters or patterns."
    }
  },
  sleep: {
    recommended: "Adults need 7-9 hours of sleep per night for optimal health.",
    tips: [
      "Maintain a consistent sleep schedule",
      "Create a relaxing bedtime routine",
      "Keep your bedroom cool, dark, and quiet",
      "Avoid screens before bedtime",
      "Limit caffeine and alcohol"
    ],
    disorders: "Common sleep disorders include insomnia, sleep apnea, and restless leg syndrome. Consult a doctor if you have persistent sleep issues."
  },
  nutrition: {
    basics: [
      "Eat a variety of fruits and vegetables",
      "Choose whole grains over refined grains",
      "Include lean proteins in your diet",
      "Limit processed foods and added sugars",
      "Stay hydrated with water"
    ],
    mealPlanning: "Aim for 3 balanced meals daily with healthy snacks in between if needed.",
    portions: "Use the plate method: ½ plate vegetables, ¼ plate protein, ¼ plate whole grains."
  },
  exercise: {
    recommended: "Adults should aim for at least 150 minutes of moderate aerobic activity or 75 minutes of vigorous activity weekly.",
    types: [
      "Aerobic exercises (walking, swimming, cycling)",
      "Strength training (weights, resistance bands)",
      "Flexibility exercises (stretching, yoga)",
      "Balance exercises"
    ],
    benefits: [
      "Improves cardiovascular health",
      "Maintains healthy weight",
      "Reduces stress and anxiety",
      "Strengthens muscles and bones",
      "Enhances sleep quality"
    ]
  },
  stress: {
    management: [
      "Practice deep breathing exercises",
      "Try meditation or mindfulness",
      "Exercise regularly",
      "Maintain social connections",
      "Get adequate sleep",
      "Consider counseling or therapy"
    ],
    symptoms: [
      "Headaches",
      "Muscle tension",
      "Sleep problems",
      "Anxiety",
      "Irritability",
      "Difficulty concentrating"
    ]
  }
};

// Common questions and their responses
const commonQuestions = {
  "what is normal body temperature": "temperature.normal",
  "what is ideal temperature": "temperature.normal",
  "i have fever": "temperature.fever",
  "feeling weak": "weakness.general",
  "i feel weak": "weakness.general",
  "headache remedies": "headache.remedies",
  "head is paining": "headache.remedies",
  "what is normal blood pressure": "bloodPressure.normal",
  "high blood pressure tips": "bloodPressure.tips",
  "normal heart rate": "heartRate.normal",
  "can't sleep": "sleep.tips",
  "how much sleep do i need": "sleep.recommended",
  "healthy eating tips": "nutrition.basics",
  "exercise benefits": "exercise.benefits",
  "how much exercise": "exercise.recommended",
  "stress management": "stress.management",
  "stress symptoms": "stress.symptoms",
  "migraine symptoms": "headache.types.migraine",
  "weakness causes": "weakness.causes",
  "healthy diet": "nutrition.basics",
  "portion size": "nutrition.portions",
  "exercise types": "exercise.types"
};

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your personal medical assistant. How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef();

  const findResponse = (query) => {
    query = query.toLowerCase();
    
    // Check for exact matches in common questions
    for (let question in commonQuestions) {
      if (query.includes(question)) {
        const responsePath = commonQuestions[question];
        const pathParts = responsePath.split('.');
        let response = medicalKnowledge;
        for (let part of pathParts) {
          response = response[part];
        }
        if (Array.isArray(response)) {
          return response.join('\n\n• ');
        }
        return response;
      }
    }

    // If no exact match, provide a generic response
    return "I understand you have a medical concern. While I can provide general information, it's always best to consult with a healthcare provider for personalized medical advice. Can you please be more specific about your symptoms?";
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user'
    };

    // Generate bot response
    const botResponse = {
      id: messages.length + 2,
      text: findResponse(inputText),
      sender: 'bot'
    };

    setMessages([...messages, userMessage, botResponse]);
    setInputText('');
  };

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderMessage = (message) => {
    const isBot = message.sender === 'bot';
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessage : styles.userMessage,
        ]}
      >
        {isBot && (
          <MaterialCommunityIcons
            name="robot"
            size={20}
            color="#00CEC9"
            style={styles.botIcon}
          />
        )}
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botText : styles.userText,
          ]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot" size={24} color="#fff" />
        <Text style={styles.headerText}>Medical Assistant</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your health concern..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleSend}
        >
          <MaterialCommunityIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#00CEC9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#00CEC9',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00CEC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotScreen; 