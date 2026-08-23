import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import ShiftRegistrationScreen from "./src/screens/ShiftRegistrationScreen";
import LeaveRequestScreen from "./src/screens/LeaveRequestScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "finger-print-outline",
  History: "time-outline",
  ShiftRegistration: "calendar-outline",
  LeaveRequest: "document-text-outline",
};

const tabTitles: Record<string, string> = {
  Home: "Chấm công",
  History: "Lịch sử",
  ShiftRegistration: "Đăng ký ca",
  LeaveRequest: "Nghỉ phép",
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        title: tabTitles[route.name],
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: "#2563eb",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="ShiftRegistration" component={ShiftRegistrationScreen} />
      <Tab.Screen name="LeaveRequest" component={LeaveRequestScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ headerShown: true, title: "Đổi mật khẩu" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
