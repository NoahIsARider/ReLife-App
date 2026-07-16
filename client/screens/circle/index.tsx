import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Contact {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  message: string;
  is_primary: string;
}

const relationships = [
  { value: 'family', label: '家人', icon: 'home' as const },
  { value: 'friend', label: '挚友', icon: 'heart' as const },
  { value: 'lawyer', label: '律师', icon: 'briefcase' as const },
  { value: 'executor', label: '遗嘱执行人', icon: 'shield' as const },
];

const relationColors: Record<string, string> = {
  family: '#C4A0A0',
  friend: '#A8B5A0',
  lawyer: '#8E9AAB',
  executor: '#C4B08B',
};

export default function CircleScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formName, setFormName] = useState('');
  const [formRelation, setFormRelation] = useState('family');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contacts`);
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  const resetForm = () => {
    setFormName('');
    setFormRelation('family');
    setFormEmail('');
    setFormPhone('');
    setFormMessage('');
  };

  const handleAdd = () => {
    setEditingContact(null);
    resetForm();
    setModalVisible(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormRelation(contact.relationship);
    setFormEmail(contact.email);
    setFormPhone(contact.phone || '');
    setFormMessage(contact.message || '');
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('确认移除', '确定要将此人从信任圈中移除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '移除',
        style: 'destructive',
        onPress: async () => {
          try {
            /**
             * 服务端文件：server/src/routes/contacts.ts
             * 接口：DELETE /api/v1/contacts/:id
             * Path 参数：id: string
             */
            await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contacts/${id}`, { method: 'DELETE' });
            fetchContacts();
          } catch (err) {
            console.error('Failed to delete:', err);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      Alert.alert('提示', '请填写姓名和邮箱');
      return;
    }
    try {
      const body = {
        name: formName.trim(),
        relationship: formRelation,
        email: formEmail.trim(),
        phone: formPhone.trim() || null,
        message: formMessage.trim() || null,
        is_primary: 'false',
      };

      if (editingContact) {
        /**
         * 服务端文件：server/src/routes/contacts.ts
         * 接口：PUT /api/v1/contacts/:id
         * Path 参数：id: string
         * Body 参数：name: string, relationship: string, email: string, phone: string|null, message: string|null, is_primary: string
         */
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contacts/${editingContact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        /**
         * 服务端文件：server/src/routes/contacts.ts
         * 接口：POST /api/v1/contacts
         * Body 参数：name: string, relationship: string, email: string, phone: string|null, message: string|null, is_primary: string
         */
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setModalVisible(false);
      resetForm();
      fetchContacts();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const getRelationInfo = (rel: string) => relationships.find(r => r.value === rel) || relationships[0];

  return (
    <Screen backgroundColor="#F5F0EB" safeAreaEdges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>信任圈</Text>
        <Text style={styles.pageSubtitle}>您生命中最重要的人</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <View style={[styles.introIcon, { backgroundColor: 'rgba(168, 181, 160, 0.12)' }]}>
            <Feather name="shield" size={18} color="#A8B5A0" />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>您的信任圈</Text>
            <Text style={styles.introDesc}>
              这些人将在特定时刻收到您的数字遗产信息。请选择您最信赖的人。
            </Text>
          </View>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="users" size={28} color="#A8B5A0" />
            </View>
            <Text style={styles.emptyTitle}>信任圈还是空的</Text>
            <Text style={styles.emptyDesc}>添加您信任的人，他们会守护您的数字遗产</Text>
          </View>
        ) : (
          contacts.map(contact => {
            const relInfo = getRelationInfo(contact.relationship);
            const color = relationColors[contact.relationship] || '#C4A0A0';
            return (
              <TouchableOpacity key={contact.id} style={styles.contactCard} onPress={() => handleEdit(contact)} onLongPress={() => handleDelete(contact.id)}>
                <View style={styles.contactRow}>
                  <View style={[styles.avatar, { backgroundColor: `${color}18` }]}>
                    <Text style={[styles.avatarText, { color }]}>{contact.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactNameRow}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <View style={[styles.relBadge, { backgroundColor: `${color}15` }]}>
                        <Text style={[styles.relBadgeText, { color }]}>{relInfo.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.contactEmail}>{contact.email}</Text>
                    {contact.phone ? <Text style={styles.contactPhone}>{contact.phone}</Text> : null}
                  </View>
                  <Feather name="chevron-right" size={16} color="#BEB5AD" />
                </View>
                {contact.message ? (
                  <View style={styles.messageRow}>
                    <Feather name="message-circle" size={12} color="#BEB5AD" />
                    <Text style={styles.messageText} numberOfLines={1}>{contact.message}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)} disabled={Platform.OS === 'web'}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{editingContact ? '编辑联系人' : '添加信任之人'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={22} color="#8B7D75" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>姓名 *</Text>
                  <TextInput style={styles.input} placeholder="对方的姓名" placeholderTextColor="#BEB5AD" value={formName} onChangeText={setFormName} />

                  <Text style={styles.label}>关系</Text>
                  <View style={styles.relationRow}>
                    {relationships.map(rel => (
                      <TouchableOpacity
                        key={rel.value}
                        style={[styles.relChip, formRelation === rel.value && { backgroundColor: `${relationColors[rel.value]}20`, borderColor: relationColors[rel.value] }]}
                        onPress={() => setFormRelation(rel.value)}
                      >
                        <Feather name={rel.icon} size={14} color={formRelation === rel.value ? relationColors[rel.value] : '#8B7D75'} />
                        <Text style={[styles.relChipText, formRelation === rel.value && { color: relationColors[rel.value] }]}>
                          {rel.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>邮箱 *</Text>
                  <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#BEB5AD" value={formEmail} onChangeText={setFormEmail} autoCapitalize="none" keyboardType="email-address" />

                  <Text style={styles.label}>电话</Text>
                  <TextInput style={styles.input} placeholder="手机号码" placeholderTextColor="#BEB5AD" value={formPhone} onChangeText={setFormPhone} keyboardType="phone-pad" />

                  <Text style={styles.label}>寄语</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="写下您想对TA说的话..."
                    placeholderTextColor="#BEB5AD"
                    value={formMessage}
                    onChangeText={setFormMessage}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#4A3F3A', letterSpacing: 1 },
  pageSubtitle: { fontSize: 14, color: '#8B7D75', marginTop: 6 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  introCard: {
    flexDirection: 'row', backgroundColor: '#FAF7F4', borderRadius: 18, padding: 16, marginBottom: 20,
    shadowColor: '#4A3F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  introIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, marginLeft: 12 },
  introTitle: { fontSize: 14, fontWeight: '600', color: '#4A3F3A', marginBottom: 4 },
  introDesc: { fontSize: 12, color: '#8B7D75', lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(168, 181, 160, 0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#4A3F3A', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#8B7D75', textAlign: 'center' },
  contactCard: {
    backgroundColor: '#FAF7F4', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#4A3F3A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  contactInfo: { flex: 1, marginLeft: 14 },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#4A3F3A' },
  relBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  relBadgeText: { fontSize: 11, fontWeight: '600' },
  contactEmail: { fontSize: 13, color: '#8B7D75', marginTop: 3 },
  contactPhone: { fontSize: 12, color: '#BEB5AD', marginTop: 2 },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#EDE8E3' },
  messageText: { fontSize: 12, color: '#BEB5AD', flex: 1 },
  fab: {
    position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#A8B5A0', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#A8B5A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(74, 63, 58, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F0EB', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#4A3F3A' },
  modalBody: { paddingHorizontal: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#8B7D75', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#EDE8E3', borderRadius: 14, padding: 14, fontSize: 15, color: '#4A3F3A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  textArea: { height: 80 },
  relationRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  relChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#EDE8E3', borderWidth: 1, borderColor: 'transparent' },
  relChipText: { fontSize: 12, color: '#8B7D75', fontWeight: '500' },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 30 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EDE8E3' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#8B7D75' },
  saveBtn: { backgroundColor: '#A8B5A0' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
