import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  IconButton,
  Searchbar,
  ActivityIndicator
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllAnswerKeys, deleteAnswerKey } from '../services/database';

export default function AnswerKeysScreen({ navigation }) {
  const [answerKeys, setAnswerKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnswerKeys();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadAnswerKeys();
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterAnswerKeys();
  }, [searchQuery, answerKeys]);

  const loadAnswerKeys = async () => {
    setLoading(true);
    const keys = await getAllAnswerKeys();
    setAnswerKeys(keys);
    setLoading(false);
  };

  const filterAnswerKeys = () => {
    if (!searchQuery) {
      setFilteredKeys(answerKeys);
      return;
    }
    
    const filtered = answerKeys.filter(key =>
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredKeys(filtered);
  };

  const handleDelete = (key) => {
    Alert.alert(
      'Delete Answer Key',
      `Are you sure you want to delete "${key.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAnswerKey(key.id);
            loadAnswerKeys();
          }
        }
      ]
    );
  };

  const handleEdit = (key) => {
    navigation.navigate('CreateAnswerKey', { answerKey: key });
  };

  const handleUse = (key) => {
    navigation.navigate('Template', { answerKey: key });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Paragraph style={styles.loadingText}>Loading answer keys...</Paragraph>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>📋 Answer Keys</Title>
        <Paragraph style={styles.headerSubtitle}>
          Manage exam answer keys for grading
        </Paragraph>
      </View>

      <Searchbar
        placeholder="Search answer keys..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredKeys.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title style={styles.emptyTitle}>No Answer Keys Yet</Title>
              <Paragraph style={styles.emptyText}>
                Create your first answer key to start grading exams automatically.
              </Paragraph>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateAnswerKey')}
                style={styles.emptyButton}
                icon="plus">
                Create Answer Key
              </Button>
            </Card.Content>
          </Card>
        ) : (
          filteredKeys.map(key => (
            <Card key={key.id} style={styles.keyCard}>
              <Card.Content>
                <View style={styles.keyHeader}>
                  <View style={styles.keyInfo}>
                    <Title style={styles.keyName}>{key.name}</Title>
                    {key.subject && (
                      <Chip icon="book" style={styles.subjectChip}>
                        {key.subject}
                      </Chip>
                    )}
                  </View>
                  <View style={styles.keyActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEdit(key)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(key)}
                    />
                  </View>
                </View>

                <View style={styles.keyDetails}>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Questions:</Paragraph>
                    <Paragraph style={styles.detailValue}>{key.totalQuestions}</Paragraph>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Points:</Paragraph>
                    <Paragraph style={styles.detailValue}>
                      {key.pointsPerQuestion || 1} each
                    </Paragraph>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Created:</Paragraph>
                    <Paragraph style={styles.detailValue}>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </Paragraph>
                  </View>
                </View>

                {key.negativeMarking && (
                  <Chip
                    icon="minus-circle"
                    style={styles.negativeChip}
                    textStyle={styles.chipText}>
                    Negative Marking (-{key.negativeMarkValue})
                  </Chip>
                )}
              </Card.Content>

              <Card.Actions>
                <Button
                  mode="outlined"
                  onPress={() => handleEdit(key)}
                  icon="pencil">
                  Edit
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleUse(key)}
                  icon="play">
                  Use for Scanning
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Answer Key"
        onPress={() => navigation.navigate('CreateAnswerKey')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4
  },
  searchBar: {
    margin: 16,
    elevation: 2
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#666666'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100
  },
  emptyCard: {
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24
  },
  emptyButton: {
    backgroundColor: '#2E7D32'
  },
  keyCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  keyInfo: {
    flex: 1
  },
  keyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8
  },
  subjectChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8'
  },
  keyActions: {
    flexDirection: 'row'
  },
  keyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  detailItem: {
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  negativeChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FFEBEE'
  },
  chipText: {
    fontSize: 12
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E7D32'
  }
});
