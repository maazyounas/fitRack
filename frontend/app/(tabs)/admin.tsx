import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, FlatList, ActivityIndicator, Alert, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore, AdminAnalytics, AdminLog, AdminError } from '@/store/adminStore';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Button } from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'overview' | 'users' | 'exercises' | 'logs' | 'notify';

export default function AdminHubScreen() {
  const { data, isLoading, initialize, toggleUserStatus, deleteExercise, sendBroadcast } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleToggleUser = (userId: string, name: string) => {
    Alert.alert(
      'Change User Status',
      `Are you sure you want to toggle the status for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => toggleUserStatus(userId) }
      ]
    );
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastBody) return;
    try {
      await sendBroadcast(broadcastTitle, broadcastBody);
      Alert.alert('Success', 'Broadcast sent to all active members.');
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send broadcast.');
    }
  };

  const renderOverview = () => {
    if (!data?.analytics) return null;
    const { analytics } = data;

    const userStatsData = [
      { value: analytics.users.total, label: 'Total', frontColor: '#0f172a' },
      { value: analytics.users.active, label: 'Active', frontColor: '#0f766e' },
      { value: analytics.users.disabled, label: 'Suspended', frontColor: '#ef4444' },
    ];

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: '#f0fdfa' }]}>
            <Text style={styles.statLabel}>Total Members</Text>
            <Text style={styles.statValue}>{analytics.users.total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
            <Text style={styles.statLabel}>Active Sessions</Text>
            <Text style={styles.statValue}>{analytics.content.activeSessions}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
            <Text style={styles.statLabel}>Total Exercises</Text>
            <Text style={styles.statValue}>{analytics.content.exercises}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fff7ed' }]}>
            <Text style={styles.statLabel}>Community Posts</Text>
            <Text style={styles.statValue}>{analytics.content.communityPosts}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Member Distribution</Text>
          <BarChart
            data={userStatsData}
            width={SCREEN_WIDTH - 80}
            height={180}
            barWidth={40}
            noOfSections={4}
            barBorderRadius={8}
            xAxisThickness={0}
            yAxisThickness={0}
            hideRules
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Engagement Retention (7d)</Text>
          <View style={styles.retentionRow}>
            <View style={styles.retentionItem}>
              <Text style={styles.retentionValue}>{analytics.retention.newLast7Days}</Text>
              <Text style={styles.retentionLabel}>New Signups</Text>
            </View>
            <View style={styles.retentionItem}>
              <Text style={styles.retentionValue}>{analytics.retention.activeLast7Days}</Text>
              <Text style={styles.retentionLabel}>DAU (Avg)</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Popular Exercises</Text>
          {analytics.popularExercises.map((ex, i) => (
            <View key={i} style={styles.popularItem}>
              <Text style={styles.popularName}>{ex.name}</Text>
              <Text style={styles.popularCount}>{ex.count} uses</Text>
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
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listMain}>
            <Text style={styles.listTitle}>{item.profile.name}</Text>
            <Text style={styles.listSubtitle}>{item.email}</Text>
          </View>
          <Pressable 
            style={[styles.statusBadge, item.deactivatedAt && styles.statusBadgeInactive]}
            onPress={() => handleToggleUser(item.id, item.profile.name)}
          >
            <Text style={[styles.statusText, item.deactivatedAt && styles.statusTextInactive]}>
              {item.deactivatedAt ? 'Suspended' : 'Active'}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );

  const renderExercises = () => (
    <FlatList
      data={data?.exercises}
      keyExtractor={(item) => item.id}
      style={styles.tabContent}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listMain}>
            <Text style={styles.listTitle}>{item.name}</Text>
            <Text style={styles.listSubtitle}>{item.muscleGroup} • {item.difficulty}</Text>
          </View>
          <Pressable onPress={() => Alert.alert('Edit', 'Edit exercise logic goes here.')}>
            <Ionicons name="create-outline" size={20} color="#0f766e" />
          </Pressable>
        </View>
      )}
    />
  );

  const renderLogs = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.cardTitle}>Request Logs (Recent 50)</Text>
      {data?.system.requestLogs.slice(0, 50).map((log) => (
        <View key={log.id} style={styles.logItem}>
          <Text style={[styles.logMethod, { color: log.statusCode >= 400 ? '#ef4444' : '#0f766e' }]}>
            {log.method}
          </Text>
          <Text style={styles.logPath} numberOfLines={1}>{log.path}</Text>
          <Text style={styles.logMeta}>{log.statusCode} • {log.durationMs}ms</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderNotify = () => (
    <View style={styles.tabContent}>
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Global Announcement</Text>
        <Text style={styles.cardSubtitle}>This will send a push notification to all FITRACK members.</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={broadcastTitle}
          onChangeText={setBroadcastTitle}
        />
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Message Body..."
          multiline
          value={broadcastBody}
          onChangeText={setBroadcastBody}
        />
        <Button label="Broadcast Now" onPress={handleBroadcast} disabled={!broadcastTitle || !broadcastBody} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Pressable onPress={() => setActiveTab('overview')} style={[styles.tab, activeTab === 'overview' && styles.activeTab]}>
          <Ionicons name="analytics" size={20} color={activeTab === 'overview' ? '#0f766e' : '#64748b'} />
        </Pressable>
        <Pressable onPress={() => setActiveTab('users')} style={[styles.tab, activeTab === 'users' && styles.activeTab]}>
          <Ionicons name="people" size={20} color={activeTab === 'users' ? '#0f766e' : '#64748b'} />
        </Pressable>
        <Pressable onPress={() => setActiveTab('exercises')} style={[styles.tab, activeTab === 'exercises' && styles.activeTab]}>
          <Ionicons name="barbell" size={20} color={activeTab === 'exercises' ? '#0f766e' : '#64748b'} />
        </Pressable>
        <Pressable onPress={() => setActiveTab('logs')} style={[styles.tab, activeTab === 'logs' && styles.activeTab]}>
          <Ionicons name="terminal" size={20} color={activeTab === 'logs' ? '#0f766e' : '#64748b'} />
        </Pressable>
        <Pressable onPress={() => setActiveTab('notify')} style={[styles.tab, activeTab === 'notify' && styles.activeTab]}>
          <Ionicons name="notifications" size={20} color={activeTab === 'notify' ? '#0f766e' : '#64748b'} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0f766e" size="large" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#0f766e' },
  tabContent: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 20 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  chartCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  retentionRow: { flexDirection: 'row', gap: 20 },
  retentionItem: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16 },
  retentionValue: { fontSize: 20, fontWeight: '900', color: '#0f766e' },
  retentionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginTop: 4 },
  popularItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  popularName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  popularCount: { fontSize: 14, fontWeight: '800', color: '#0f766e' },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10 },
  listMain: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  listSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { backgroundColor: '#ecfeff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeInactive: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  statusTextInactive: { color: '#ef4444' },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logMethod: { width: 45, fontSize: 11, fontWeight: '900' },
  logPath: { flex: 1, fontSize: 12, color: '#334155', marginHorizontal: 10 },
  logMeta: { fontSize: 10, color: '#94a3b8', width: 80, textAlign: 'right' },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, fontSize: 15, color: '#0f172a', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
});
