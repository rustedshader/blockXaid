import os
from dotenv import load_dotenv
from web3 import Web3
from solcx import compile_source
from web3.middleware import ExtraDataToPOAMiddleware  

load_dotenv()

AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology'
AMOY_CHAIN_ID = '0x13882'
AMOY_CONTRACT_URL = 'https://amoy.polygonscan.com/'
AMOY_NAME = 'Amoy'
AMOY_SYMBOL = 'POL'
AMOY_CHAIN_NAME = 'Polygon Amoy'
ARBITAR_ADRESS=os.getenv('ARBITAR_ADRESS')
METAMASK_WALLET_PRIVATE_KEY=os.getenv('METAMASK_WALLET_PRIVATE_KEY')

def deploy_contract(buyer_address: str, seller_address: str):
    with open('escrowContract.sol', 'r') as file:
        contract_file = file.read()

    compiled_sol = compile_source(contract_file,output_values=['abi','bin'])
    
    _, contract_interface = compiled_sol.popitem()

    bytecode = contract_interface['bin']

    abi = contract_interface['abi']

    w3 = Web3(Web3.HTTPProvider(AMOY_RPC_URL))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware,layer=0)

    account = w3.eth.account.from_key(METAMASK_WALLET_PRIVATE_KEY)


    Greeter = w3.eth.contract(abi=abi, bytecode=bytecode)

    args = [buyer_address,seller_address,ARBITAR_ADRESS]
    nonce = w3.eth.get_transaction_count(account.address)
    transaction = Greeter.constructor(*args).build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': 2000000,
        'maxFeePerGas': 35000000000,  # Very low gas fee for testnet
        'maxPriorityFeePerGas': 35000000000  # Very low priority fee for testnet
    })

    signed_txn = w3.eth.account.sign_transaction(transaction, private_key=METAMASK_WALLET_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    address=tx_receipt.contractAddress

    return address

if __name__ == '__main__':
    print(deploy_contract('0x5f351FBf5Dea981A6C06DfcadA464b84b5e5F871','0xeba481C85a80CF3a6C335C4855E6716Cdb13D414'))