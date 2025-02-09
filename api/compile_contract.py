from solcx import compile_standard, install_solc

install_solc('0.8.26')

with open('escrowContract.sol', 'r') as file:
    contract_file = file.read()

compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"escrowContract.sol": {"content": contract_file}},
    },
    solc_version='0.8.26'
)

abi =  compiled_sol['contracts']['escrowContract.sol']['Escrow']['abi']