import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/Login';
import CreateAccount from './screens/CreateAccount';
import HomeScreen from './screens/HomeScreen';
import SellerDashboard from './screens/SellerDashboard';
import SellerCreateOrder from './screens/SellerCreateOrder';
import SellerAcceptOrder from './screens/SellerAcceptOrder';
import SellerActiveOrder from './screens/SellerActiveOrder';
import SellerPastOrders from './screens/SellerPastOrders';
import OrgDashboard from './screens/OrgDashboard';
import OrgPayOrders from './screens/OrgPayOrders';
import OrgWatingOrders from './screens/OrgWaitingOrders';
import OrgActiveOrders from './screens/OrgActiveOrders';
import ChatbotScreen from './screens/Chatbot';
import SellerShipmentOrder from './screens/SellerShipementOrder';
import OrgPastOrders from './screens/OrgPastOrders';
import SellerEditListings from './screens/SellerEditListings';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="HomeScreen"
        screenOptions={{
          headerShown: true
        }}
      >
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccount} />
        <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
        <Stack.Screen name="SellerCreateOrder" component={SellerCreateOrder} />
        <Stack.Screen name="SellerAcceptOrder" component={SellerAcceptOrder} />
        <Stack.Screen name="SellerActiveOrder" component={SellerActiveOrder} />
        <Stack.Screen name="SellerShipmentOrder" component={SellerShipmentOrder}/>
        <Stack.Screen name="SellerPastOrders" component={SellerPastOrders} />
        <Stack.Screen name="SellerEditListings" component={SellerEditListings}/>
        <Stack.Screen name="OrgDashboard" component={OrgDashboard} />
        <Stack.Screen name="OrgPayOrders" component={OrgPayOrders}/>
        <Stack.Screen name="OrgWaitingOrders" component={OrgWatingOrders}/>
        <Stack.Screen name="OrgActiveOrders" component={OrgActiveOrders}/>
        <Stack.Screen name="OrgPastOrders" component={OrgPastOrders} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen}/>
      </Stack.Navigator>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
