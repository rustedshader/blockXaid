import os
from dotenv import load_dotenv
from web3 import Web3
from solcx import compile_source

load_dotenv()

AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology'
AMOY_CHAIN_ID = '0x13882'
AMOY_CONTRACT_URL = 'https://amoy.polygonscan.com/'
AMOY_NAME = 'Amoy'
AMOY_SYMBOL = 'POL'
AMOY_CHAIN_NAME = 'Polygon Amoy'
ARBITAR_ADRESS=os.getenv('ARBITAR_ADRESS')
METAMASK_WALLET_PRIVATE_KEY=os.getenv('METAMASK_WALLET_PRIVATE_KEY')


def get_pseudo_balance(contract_address: str, user_address: str):
    with open('escrowContract.sol', 'r') as file:
        contract_file = file.read()
    compiled_sol = compile_source(contract_file,output_values=['abi','bin'])
    _, contract_interface = compiled_sol.popitem()
    abi = contract_interface['abi']
    w3 = Web3(Web3.HTTPProvider(AMOY_RPC_URL))
    contract = w3.eth.contract(address=contract_address, abi=abi)
    balance = contract.functions.getPseudoBalance(user_address).call()
    return balance



if __name__ == '__main__':
    print(get_pseudo_balance('0xCd58b162aFeA188BAF5BA82a7a35802593570F20','0xeba481C85a80CF3a6C335C4855E6716Cdb13D414'))