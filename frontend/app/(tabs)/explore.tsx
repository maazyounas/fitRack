import { Image } from 'expo-image';
import { StyleSheet, ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// Feature Card Component
function FeatureCard({ icon, title, description, color, onPress }: { 
  icon: string; 
  title: string; 
  description: string; 
  color: readonly [string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <LinearGradient colors={color} style={styles.featureIcon}>
        <Ionicons name={icon as any} size={28} color="#fff" />
      </LinearGradient>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

// Workout Card Component
function WorkoutCard({ title, duration, calories, image, onPress }: {
  title: string;
  duration: string;
  calories: string;
  image: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.workoutCard} onPress={onPress}>
      <Image source={image} style={styles.workoutImage} contentFit="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.workoutOverlay} />
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutTitle}>{title}</Text>
        <View style={styles.workoutStats}>
          <View style={styles.workoutStat}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.workoutStatText}>{duration}</Text>
          </View>
          <View style={styles.workoutStat}>
            <Ionicons name="flame-outline" size={14} color="#fff" />
            <Text style={styles.workoutStatText}>{calories} kcal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Category Pill Component
function CategoryPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={[styles.categoryPill, active && styles.categoryPillActive]} 
      onPress={onPress}
    >
      <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['All', 'Strength', 'Cardio', 'Yoga', 'HIIT'];

  const featuredWorkouts = [
    { title: 'Full Body Blast', duration: '25 min', calories: '220', image: require('@/assets/images/react-logo.png') },
    { title: 'Morning Stretch', duration: '10 min', calories: '60', image: require('@/assets/images/react-logo.png') },
    { title: 'Core Crusher', duration: '15 min', calories: '150', image: require('@/assets/images/react-logo.png') },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Discover Your</Text>
          <Text style={styles.heroTitleAccent}>Best Self</Text>
          <Text style={styles.heroSubtitle}>
            Explore workouts, track progress, and join challenges tailored just for you
          </Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>150+</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10k+</Text>
            <Text style={styles.statLabel}>Active Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(workout)/plan' as any)}>
            <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.quickActionIcon}>
              <Ionicons name="barbell-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Start Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(nutrition)/track' as any)}>
            <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.quickActionIcon}>
              <Ionicons name="restaurant-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Log Meal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(community)/challenges' as any)}>
            <LinearGradient colors={['#8b5cf6', '#a78bfa']} style={styles.quickActionIcon}>
              <Ionicons name="trophy-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Challenges</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(progress)/track' as any)}>
            <LinearGradient colors={['#ef4444', '#f87171']} style={styles.quickActionIcon}>
              <Ionicons name="stats-chart-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Features</Text>
        <FeatureCard
          icon="scan-outline"
          title="AI Body Scan"
          description="Get detailed body composition analysis"
          color={['#0d9488', '#14b8a6']}
          onPress={() => router.push('/(modals)/scan' as any)}
        />
        <FeatureCard
          icon="calendar-outline"
          title="Smart Workout Plans"
          description="Personalized plans that adapt to your progress"
          color={['#f59e0b', '#fbbf24']}
          onPress={() => router.push('/(workout)/plans' as any)}
        />
        <FeatureCard
          icon="nutrition-outline"
          title="Meal Planning"
          description="AI-generated meal plans based on your goals"
          color={['#8b5cf6', '#a78bfa']}
          onPress={() => router.push('/(nutrition)/plans' as any)}
        />
      </View>

      {/* Featured Workouts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Workouts</Text>
          <TouchableOpacity onPress={() => router.push('/(workout)/all' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutsScroll}>
          {featuredWorkouts.map((workout, index) => (
            <WorkoutCard
              key={index}
              title={workout.title}
              duration={workout.duration}
              calories={workout.calories}
              image={workout.image}
              onPress={() => router.push('/(workout)/details' as any)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Popular Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category, index) => (
            <CategoryPill
              key={index}
              label={category}
              active={selectedCategory === category.toLowerCase()}
              onPress={() => setSelectedCategory(category.toLowerCase())}
            />
          ))}
        </ScrollView>
      </View>

      {/* Community Highlights */}
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Highlights</Text>
          <TouchableOpacity onPress={() => router.push('/(community)/feed' as any)}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.communityCard}>
          <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.communityContent}>
            <Ionicons name="people" size={32} color="#f59e0b" />
            <Text style={styles.communityTitle}>Join Our Community</Text>
            <Text style={styles.communityText}>
              Connect with 10,000+ fitness enthusiasts, share your journey, and stay motivated
            </Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Now →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Hero Section
  heroSection: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    fontSize: 36,
    fontWeight: '600',
    color: '#0d9488',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d9488',
  },
  
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  
  // Feature Card
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 18,
  },
  
  // Workout Card
  workoutsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  workoutCard: {
    width: 180,
    height: 200,
    marginRight: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  workoutImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  workoutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  workoutInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Categories
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  
  // Community Card
  communityCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  communityContent: {
    padding: 24,
    alignItems: 'center',
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  communityText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});