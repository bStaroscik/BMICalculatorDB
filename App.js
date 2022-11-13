import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, SafeAreaView, ScrollView, TextInput, TouchableOpacity, StyleSheet, Text, View, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, weight, height, results, date(itemDate) as itemDate from bmicalc order by itemDate desc;`,
        [], 
        (_, { rows: { _array } }) => setItems(_array)
      );
      tx.executeSql("select id, weight, height, results, date(itemDate) as itemDate from bmicalc order by itemDate desc;", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
    });
  }, []);

  const heading = "BMI History";

  if (items ===  null || items.length === 0) {
    // return null;
    return (
      <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      </View>
    )
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, weight, height, results, itemDate }) => (
        <Text key={id} style={{ color: "#fff" }}>{itemDate}: {results} (W:{weight} H:{height})</Text>
      ))}
    </View>
  );
}

export default function App() {
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [results, setResults] = useState(0);
  const [resultString, setResultsString] =  useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      /* tx.executeSql(
        "drop table bmicalc;"
      ); */
      tx.executeSql(
        "create table if not exists bmicalc (id integer primary key not null, weight int, height int, results int, itemDate real);"
      );
    });
  }, []);

  const add = (weight, height) => {
    // is text empty?
    if (weight === null || weight === "") {
      return false;
    }

    if(height === null || height === "") {
      return false;
    }

    if(isNaN(weight)) {
      Alert.alert('Error', 'Weight must be a number');
    } else if (isNaN(height)) {
      Alert.alert('Error', 'Height must be a number');
    } else if ('' === weight) {
      Alert.alert('Error', 'Weight is required field');
    } else if ('' === height) {
      Alert.alert('Error', 'Height is a required field');
    } else {
      setResults('Loading....');
      const results = ((weight/(height * height))*703).toFixed(1);
      const resultString = 'Body Mass Index is ' + results;
      setResultsString(resultString);
      setResults(results);
    }

    add2DB();
    
  };

  const add2DB = () => {
    db.transaction(
      (tx) => {
        tx.executeSql("insert into bmicalc (weight, height, results, itemDate) values (?, ?, ?, julianday('now'))", [weight, height, results]);
        tx.executeSql("select * from bmicalc", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.toolbar}>BMI Calculator</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.container}>
            <TextInput
              onChangeText={(weight) => setWeight(weight)}
              placeholder="Weight in Pounds?"
              style={styles.input}
              value={weight}
            />
            <TextInput
              onChangeText={(height) => setHeight(height)}
              style={styles.input}  
              value={height} placeholder="Height in Inches" 
            />
            <TouchableOpacity 
              onPress={() => {
                
                add(weight, height);
                setHeight(null);
                setWeight(null);
              }} 
              style={styles.button}>
              <Text style={styles.buttonText}>Compute BMI</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.preview} value={resultString} placeholder="Results..." editable={false} multiline />
          
          <ScrollView style={styles.listArea}>
            <Items />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );


}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  preview: {
    flex: 1,
    height: 75,
    fontSize: 28,
    textAlign: 'center',
    color: '#000000'
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    flex: 1,
    fontSize: 24,
  },
  button: {
    backgroundColor: '#34495e',
    padding: 10,
    borderRadius: 3,
    marginBottom: 30,
  },
  text: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  flexRow: {
    flexDirection: "row",
  }
});

