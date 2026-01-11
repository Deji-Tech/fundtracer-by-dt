/**
 * FundTracer CLI - Interactive Mode
 * Full REPL experience for blockchain forensics.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { ChainId, getEnabledChains } from '@fundtracer/core';
import { analyzeCommand } from './analyze.js';
import { compareCommand } from './compare.js';

export async function interactiveCommand() {
    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: chalk.cyan('>'),
                prefix: '',
                choices: [
                    { name: 'Analyze a wallet', value: 'analyze' },
                    { name: 'Compare multiple wallets (Sybil detection)', value: 'compare' },
                    { name: 'Configure API key', value: 'config' },
                    { name: 'Help', value: 'help' },
                    { name: 'Exit', value: 'exit' },
                ],
            },
        ]);

        if (action === 'exit') {
            console.log(chalk.dim('\nSession ended.\n'));
            process.exit(0);
        }

        if (action === 'help') {
            showHelp();
            continue;
        }

        switch (action) {
            case 'analyze':
                await interactiveAnalyze();
                break;
            case 'compare':
                await interactiveCompare();
                break;
            case 'config':
                await interactiveConfig();
                break;
        }

        console.log('');
    }
}

function showHelp() {
    console.log(`
${chalk.white.bold('Available Commands:')}

  ${chalk.cyan('analyze <address>')}    Analyze a single wallet's funding sources
  ${chalk.cyan('compare <addr1> <addr2>')}  Compare wallets for shared funding (Sybil)
  ${chalk.cyan('config --set-key KEY')}  Set your Etherscan API key

${chalk.white.bold('Detection Capabilities:')}

  - Rapid fund movement (flash loans, MEV)
  - Same-block transactions (bot activity)
  - Circular fund flows (wash trading)
  - Sybil farming patterns
  - Fresh wallet with high activity

${chalk.dim('For more: https://github.com/Deji-Tech/fundtracer-by-dt')}
`);
}

async function interactiveAnalyze() {
    const chains = getEnabledChains();

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'address',
            message: 'Enter wallet address:',
            validate: (input) => {
                if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
                    return true;
                }
                return 'Please enter a valid Ethereum address (0x...)';
            },
        },
        {
            type: 'list',
            name: 'chain',
            message: 'Select blockchain:',
            choices: chains.map(c => ({ name: c.name, value: c.id })),
        },
        {
            type: 'list',
            name: 'depth',
            message: 'Funding tree depth:',
            choices: [
                { name: '1 - Quick scan', value: '1' },
                { name: '2 - Standard', value: '2' },
                { name: '3 - Deep (recommended)', value: '3' },
                { name: '5 - Very deep (slower)', value: '5' },
            ],
            default: '3',
        },
        {
            type: 'list',
            name: 'output',
            message: 'Output format:',
            choices: [
                { name: 'Table - Easy to read', value: 'table' },
                { name: 'Tree - Visualize funding flow', value: 'tree' },
                { name: 'JSON - Machine readable', value: 'json' },
            ],
        },
    ]);

    console.log();
    await analyzeCommand(answers.address, {
        chain: answers.chain,
        depth: answers.depth,
        output: answers.output,
    });
}

async function interactiveCompare() {
    const chains = getEnabledChains();
    const addresses: string[] = [];

    console.log(chalk.dim('Enter wallet addresses (empty to finish):\n'));

    let i = 1;
    while (true) {
        const { address } = await inquirer.prompt([
            {
                type: 'input',
                name: 'address',
                message: `Wallet #${i}:`,
                validate: (input) => {
                    if (input === '') {
                        if (addresses.length < 2) {
                            return 'Please enter at least 2 addresses';
                        }
                        return true;
                    }
                    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
                        return true;
                    }
                    return 'Please enter a valid address or leave empty to finish';
                },
            },
        ]);

        if (address === '') break;
        addresses.push(address);
        i++;
    }

    const { chain } = await inquirer.prompt([
        {
            type: 'list',
            name: 'chain',
            message: 'Select blockchain:',
            choices: chains.map(c => ({ name: c.name, value: c.id })),
        },
    ]);

    console.log();
    await compareCommand(addresses, {
        chain,
        depth: '2',
        output: 'table',
    });
}

async function interactiveConfig() {
    const chains = getEnabledChains();

    const { chain } = await inquirer.prompt([
        {
            type: 'list',
            name: 'chain',
            message: 'Select chain to configure:',
            choices: chains.map(c => ({ name: c.name, value: c.id })),
        },
    ]);

    const { apiKey } = await inquirer.prompt([
        {
            type: 'password',
            name: 'apiKey',
            message: `Enter API key for ${chain}:`,
            mask: '*',
        },
    ]);

    if (apiKey) {
        const { configCommand } = await import('./config.js');
        await configCommand({ setKey: `${chain}:${apiKey}` });
    }
}
