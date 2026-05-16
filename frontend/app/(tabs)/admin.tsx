import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, FlatList, ActivityIndicator, Alert, TextInput, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '@/store/adminStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'overview' | 'users' | 'exercises' | 'logs' | 'notify';

export default function AdminHubScreen() {
  const { data, isLoading, initialize, toggleUserStatus, sendBroadcast } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleToggleUser = (userId: string, name: string, isActive: boolean) => {
    setSelectedUser({ id: userId, name, isActive });
    setShowConfirmModal(true);
  };

  const confirmToggleUser = async () => {
    if (selectedUser) {
      await toggleUserStatus(selectedUser.id);
      setShowConfirmModal(false);
      setSelectedUser(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastBody) return;
    try {
      await sendBroadcast(broadcastTitle, broadcastBody);
      Alert.alert('Success', 'Broadcast sent to all active members.');
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch {
      Alert.alert('Error', 'Failed to send broadcast.');
    }
  };

  const renderOverview = () => {
    if (!data?.analytics) return null;
    const { analytics } = data;

    const userStatsData = [
      { value: analytics.users.total, label: 'Total', frontColor: '#1e293b' },
      { value: analytics.users.active, label: 'Active', frontColor: '#0d9488' },
      { value: analytics.users.disabled, label: 'Suspended', frontColor: '#ef4444' },
    ];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.grid}>
          <LinearGradient colors={['#f0fdfa', '#ccfbf1']} style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people-outline" size={22} color="#0d9488" />
            </View>
            <Text style={styles.statLabel}>Total Members</Text>
            <Text style={styles.statValue}>{analytics.users.total}</Text>
          </LinearGradient>
          
          <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="flash-outline" size={22} color="#d97706" />
            </View>
            <Text style={styles.statLabel}>Active Sessions</Text>
            <Text style={styles.statValue}>{analytics.content.activeSessions}</Text>
          </LinearGradient>
          
          <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="barbell-outline" size={22} color="#4338ca" />
            </View>
            <Text style={styles.statLabel}>Total Exercises</Text>
            <Text style={styles.statValue}>{analytics.content.exercises}</Text>
          </LinearGradient>
          
          <LinearGradient colors={['#fce7f3', '#fbcfe8']} style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="chatbubbles-outline" size={22} color="#be185d" />
            </View>
            <Text style={styles.statLabel}>Community Posts</Text>
            <Text style={styles.statValue}>{analytics.content.communityPosts}</Text>
          </LinearGradient>
        </View>

        {/* Member Distribution Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Member Distribution</Text>
          <BarChart
            data={userStatsData}
            width={SCREEN_WIDTH - 80}
            height={200}
            barWidth={50}
            noOfSections={4}
            barBorderRadius={8}
            xAxisThickness={0}
            yAxisThickness={0}
            hideRules
            showGradient
            gradientColor="#0d9488"
          />
        </View>

        {/* Retention Stats */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>User Engagement</Text>
          <View style={styles.retentionRow}>
            <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.retentionItem}>
              <Ionicons name="person-add-outline" size={24} color="#059669" />
              <Text style={styles.retentionValue}>{analytics.retention.newLast7Days}</Text>
              <Text style={styles.retentionLabel}>New Signups</Text>
              <Text style={styles.retentionPeriod}>Last 7 days</Text>
            </LinearGradient>
            
            <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.retentionItem}>
              <Ionicons name="trending-up-outline" size={24} color="#d97706" />
              <Text style={styles.retentionValue}>{analytics.retention.activeLast7Days}</Text>
              <Text style={styles.retentionLabel}>Daily Active</Text>
              <Text style={styles.retentionPeriod}>7-day avg</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Popular Exercises */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Popular Exercises</Text>
          {analytics.popularExercises.map((ex, i) => (
            <View key={i} style={styles.popularItem}>
              <View style={styles.popularRank}>
                <Text style={styles.popularRankText}>{i + 1}</Text>
              </View>
              <Text style={styles.popularName}>{ex.name}</Text>
              <View style={styles.popularCountBadge}>
                <Text style={styles.popularCount}>{ex.count} uses</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderUsers = () => (
    <FlatList
      data={data?.users}
      keyExtractor={(item) => item.id}
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.listItem}>
          <View style={styles.listAvatar}>
            <Text style={styles.listAvatarText}>{item.profile.name.charAt(0)}</Text>
          </View>
          <View style={styles.listMain}>
            <Text style={styles.listTitle}>{item.profile.name}</Text>
            <View style={styles.listMeta}>
              <Ionicons name="mail-outline" size={12} color="#94a3b8" />
              <Text style={styles.listSubtitle}>{item.email}</Text>
            </View>
          </View>
          <Pressable 
            style={[styles.statusBadge, item.deactivatedAt && styles.statusBadgeInactive]}
            onPress={() => handleToggleUser(item.id, item.profile.name, !item.deactivatedAt)}
          >
            <View style={[styles.statusDot, item.deactivatedAt && styles.statusDotInactive]} />
            <Text style={[styles.statusText, item.deactivatedAt && styles.statusTextInactive]}>
              {item.deactivatedAt ? 'Suspended' : 'Active'}
            </Text>
          </Pressable>
        </LinearGradient>
      )}
    />
  );

  const renderExercises = () => (
    <FlatList
      data={data?.exercises}
      keyExtractor={(item) => item.id}
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.listItem}>
          <View style={styles.exerciseIcon}>
            <Ionicons name="barbell-outline" size={24} color="#0d9488" />
          </View>
          <View style={styles.listMain}>
            <Text style={styles.listTitle}>{item.name}</Text>
            <View style={styles.exerciseTags}>
              <View style={styles.exerciseTag}>
                <Text style={styles.exerciseTagText}>{item.muscleGroup}</Text>
              </View>
              <View style={[styles.exerciseTag, styles.exerciseTagDifficulty]}>
                <Text style={styles.exerciseTagText}>{item.difficulty}</Text>
              </View>
            </View>
          </View>
          <View style={styles.listActions}>
            <Pressable onPress={() => Alert.alert('Edit', 'Edit exercise feature coming soon.')} style={styles.actionButton}>
              <Ionicons name="create-outline" size={18} color="#0d9488" />
            </Pressable>
            <Pressable onPress={() => Alert.alert('Delete', 'Delete exercise feature coming soon.')} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </LinearGradient>
      )}
    />
  );

  const renderLogs = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.logsHeader}>
        <Text style={styles.cardTitle}>System Logs</Text>
        <Text style={styles.logsSubtitle}>Recent 50 requests</Text>
      </View>
      {data?.system.requestLogs.slice(0, 50).map((log) => (
        <View key={log.id} style={styles.logItem}>
          <View style={[styles.logMethodBadge, log.statusCode >= 400 ? styles.logMethodError : styles.logMethodSuccess]}>
            <Text style={styles.logMethod}>{log.method}</Text>
          </View>
          <View style={styles.logContent}>
            <Text style={styles.logPath} numberOfLines={1}>{log.path}</Text>
            <View style={styles.logMeta}>
              <Text style={[styles.logStatusCode, log.statusCode >= 400 ? { color: '#ef4444' } : { color: '#0d9488' }]}>
                {log.statusCode}
              </Text>
              <Text style={styles.logDuration}>• {log.durationMs}ms</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderNotify = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.notifyCard}>
        <View style={styles.notifyHeader}>
          <View style={styles.notifyIcon}>
            <Ionicons name="megaphone-outline" size={28} color="#0d9488" />
          </View>
          <Text style={styles.cardTitle}>Global Announcement</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Send a push notification to all active FITRACK members
        </Text>
        
        <View style={styles.inputWrapper}>
          <Ionicons name="document-text-outline" size={18} color="#64748b" />
          <TextInput
            style={styles.input}
            placeholder="Notification title"
            placeholderTextColor="#94a3b8"
            value={broadcastTitle}
            onChangeText={setBroadcastTitle}
          />
        </View>
        
        <View style={[styles.inputWrapper, styles.inputWrapperTextArea]}>
          <Ionicons name="document-text-outline" size={18} color="#64748b" style={styles.textAreaIcon} />
          <TextInput
            style={styles.inputTextArea}
            placeholder="Message body..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={broadcastBody}
            onChangeText={setBroadcastBody}
          />
        </View>
        
        <Pressable 
          style={[styles.broadcastButton, (!broadcastTitle || !broadcastBody) && styles.broadcastButtonDisabled]} 
          onPress={handleBroadcast}
          disabled={!broadcastTitle || !broadcastBody}
        >
          <LinearGradient
            colors={!broadcastTitle || !broadcastBody ? ['#cbd5e1', '#cbd5e1'] : ['#0d9488', '#0f766e']}
            style={styles.broadcastGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="send-outline" size={18} color="#ffffff" />
            <Text style={styles.broadcastButtonText}>Send Broadcast</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.header}>
        <Text style={styles.headerTitle}>Admin Hub</Text>
        <Text style={styles.headerSubtitle}>Manage your fitness platform</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'overview', icon: 'stats-chart-outline', label: 'Overview' },
          { key: 'users', icon: 'people-outline', label: 'Users' },
          { key: 'exercises', icon: 'barbell-outline', label: 'Exercises' },
          { key: 'logs', icon: 'terminal-outline', label: 'Logs' },
          { key: 'notify', icon: 'notifications-outline', label: 'Notify' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key as TabType)}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.key ? '#0d9488' : '#64748b'} 
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'exercises' && renderExercises()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'notify' && renderNotify()}
        </>
      )}

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={48} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Confirm Status Change</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to {selectedUser?.isActive ? 'suspend' : 'activate'} {selectedUser?.name}?
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonConfirm]} onPress={confirmToggleUser}>
                <Text style={styles.modalButtonConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#f0fdfa',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabLabel: {
    color: '#0d9488',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 20,
  },
  retentionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retentionItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  retentionValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 10,
  },
  retentionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginTop: 4,
  },
  retentionPeriod: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8',
    marginTop: 2,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  popularRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  popularName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  popularCountBadge: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0d9488',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0d9488',
  },
  listMain: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeInactive: {
    backgroundColor: '#fef2f2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusDotInactive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  statusTextInactive: {
    color: '#ef4444',
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  exerciseTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  exerciseTagDifficulty: {
    backgroundColor: '#fef3c7',
  },
  exerciseTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  logsHeader: {
    marginBottom: 16,
  },
  logsSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
    marginTop: 2,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  logMethodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logMethodSuccess: {
    backgroundColor: '#ecfdf5',
  },
  logMethodError: {
    backgroundColor: '#fef2f2',
  },
  logMethod: {
    fontSize: 10,
    fontWeight: '700',
  },
  logContent: {
    flex: 1,
  },
  logPath: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 2,
  },
  logMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  logStatusCode: {
    fontSize: 10,
    fontWeight: '600',
  },
  logDuration: {
    fontSize: 10,
    color: '#94a3b8',
  },
  notifyCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notifyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputWrapperTextArea: {
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#1e293b',
    paddingVertical: 14,
  },
  inputTextArea: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#1e293b',
    paddingVertical: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  broadcastButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  broadcastButtonDisabled: {
    opacity: 0.6,
  },
  broadcastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  broadcastButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: SCREEN_WIDTH - 60,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  modalButtonConfirm: {
    backgroundColor: '#0d9488',
  },
  modalButtonConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});