import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import TestsListScreen from "../screens/TestsListScreen";
import TakeTestScreen from "../screens/TakeTestScreen";
import PairOnboardingScreen from "../screens/PairOnboardingScreen";
import PairDashboardScreen from "../screens/PairDashboardScreen";
import { User } from "firebase/auth";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  TestsList: undefined;
  TakeTest: { testId: string };
  PairSetup: undefined;
  PairDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator({ user }: { user: User | null }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="TestsList" component={TestsListScreen} />
          <Stack.Screen name="TakeTest" component={TakeTestScreen} />
          <Stack.Screen name="PairSetup" component={PairOnboardingScreen} />
          <Stack.Screen name="PairDashboard" component={PairDashboardScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}
