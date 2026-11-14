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
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendMedicalChat, getChatModeHint } from '../_services/aiChatService';
import { MEDICAL_DISCLAIMER } from '../_services/aiChatGuardrails';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: `Hi — I’m MedAssist Medical AI. Ask about vitals, wellness, or your digital twin risk score.\n\n${MEDICAL_DISCLAIMER}`,
      sender: 'bot',
      source: 'system',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, text, sender: 'user' }]);
    setBusy(true);
    try {
      const result = await sendMedicalChat(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          text: result.reply,
          sender: 'bot',
          source: result.source,
          blocked: result.blocked,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          text: `Something went wrong. ${MEDICAL_DISCLAIMER}`,
          sender: 'bot',
          source: 'error',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.banner}>
        <MaterialCommunityIcons name="shield-check" size={18} color="#fff" />
        <Text style={styles.bannerText}>Guardrailed medical chat · {getChatModeHint()}</Text>
      </View>

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding: 16 }}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}
          >
            <Text style={msg.sender === 'user' ? styles.userText : styles.botText}>{msg.text}</Text>
            {msg.source && msg.sender === 'bot' ? (
              <Text style={styles.meta}>source: {msg.source}</Text>
            ) : null}
          </View>
        ))}
        {busy ? <ActivityIndicator color="#00CEC9" style={{ marginVertical: 8 }} /> : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about heart rate, SpO2, fever, falls…"
          placeholderTextColor="#999"
          onSubmitEditing={send}
          editable={!busy}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={busy}>
          <MaterialCommunityIcons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f7' },
  banner: {
    backgroundColor: '#0984e3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: { color: '#fff', flex: 1, fontSize: 12, lineHeight: 16 },
  messages: { flex: 1 },
  bubble: {
    maxWidth: '92%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#00CEC9',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0f2f1',
  },
  userText: { color: '#fff', lineHeight: 20 },
  botText: { color: '#2d3436', lineHeight: 20 },
  meta: { marginTop: 6, fontSize: 11, color: '#636e72' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#00CEC9',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
