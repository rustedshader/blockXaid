import os
from dotenv import load_dotenv
import requests

load_dotenv()

ARBITAR_ADRESS = os.getenv("ARBITAR_ADRESS")
POLYGON_AMOY_API_KEY = os.getenv("POLYGON_SCAN_API_KEY")


def detect_sus(contract_address: str, buyer_address: str, seller_address: str):
    r = requests.get(f'https://api-amoy.polygonscan.com/api?module=account&action=txlist&address={contract_address}&startblock=0&endblock=latest&sort=asc&apikey={POLYGON_AMOY_API_KEY}')
    transactions = r.json()['result']
    
    allowed_addresses = [
        ARBITAR_ADRESS.lower(),
        seller_address.lower(),
        buyer_address.lower(),
        contract_address.lower()
    ]
    
    suspicious_transactions = []
    
    for transaction in transactions:
        from_address = transaction['from'].lower()
        to_address = transaction['to'].lower()
        
        if (from_address not in allowed_addresses and from_address != '') or \
           (to_address not in allowed_addresses and to_address != ''):
            suspicious_transactions.append({
                'hash': transaction['hash'],
                'from': transaction['from'],
                'to': transaction['to'],
                'value': transaction['value'],
                'timestamp': transaction['timeStamp']
            })
    
    formatted_transactions = []
    for tx in suspicious_transactions:
        formatted_transactions.append({
            'Transaction Hash': tx['hash'],
            'From Address': tx['from'],
            'To Address': tx['to'],
            'Value': int(tx['value']) / (10 ** 18), # Conversion to POL :))  
            'Timestamp': tx['timestamp']
        })
    
    return formatted_transactions
        

if __name__ == '__main__':
    print(detect_sus('0x2b3de0499B3774A5D71c0909b7FA615A0aE72511','0x5f351FBf5Dea981A6C06DfcadA464b84b5e5F871','0xeba481C85a80CF3a6C335C4855E6716Cdb13D414'))