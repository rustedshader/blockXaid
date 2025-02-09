// import { useState } from "react";

// export default  function SellerActiveOrderStatus(){
//     const [userId, setUserId] = useState<string>('');
//     const [orderId, setOrderId] = useState<string>('');

//     const getData = async() => {
//         try {
//             const id = await AsyncStorage.getItem('id');
//             const type = await AsyncStorage.getItem('type');
//             if (id && type === 'SELLER'){
//                 setUserId(id);
//             } else {
//                 alert('You are not authorized to view this page');
//             }
//         } catch (error) {
//             alert('An error occurred during opening Dashboard');
//         }
//     }

//     const changeOrderStatus = async() => {
//         try {
//             const response: Response = await fetch(
//                 `${process.env.EXPO_PUBLIC_API_URL}/change_order_status?order_id=${orderId}&status=ACTIVE`,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/x-www-form-urlencoded',
//                     },
//                 }
//             );
//             const data: OrderStatusChangeResponse = await response.json();
//             if (data.status === 'success'){
//                 alert('Order status changed successfully');
//             }
//         } catch (error) {
//             alert('An error occurred during changing order status');
//         }
//     }

//     return (
//         <View>
//             <TextInput
//                 placeholder="Enter order id"
//                 onChangeText={setOrderId}
//             />
//             <Button
//                 title="Change order status"
//                 onPress={changeOrderStatus}
//             />
//         </View>
//     )

// }