'use server';
/**
 * @fileOverview A Genkit flow for detecting anomalous transactions.
 *
 * - detectTransactionAnomalies - A function that analyzes transaction logs to identify suspicious activities.
 * - TransactionLogInput - The input type for the detectTransactionAnomalies function.
 * - AnomalyDetectionOutput - The return type for the detectTransactionAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItemSchema = z.object({
  itemId: z.string().describe('The ID of the item.'),
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The quantity of the item.'),
});

const TransactionSchema = z.object({
  id: z.string().describe('The unique ID of the transaction.'),
  userId: z.string().describe('The ID of the user who performed the transaction.'),
  userName: z.string().describe('The name of the user who performed the transaction.'),
  items: z.array(ItemSchema).describe('An array of items involved in the transaction.'),
  status: z.enum(['active', 'returned']).describe('The current status of the transaction (active or returned).'),
  borrowTime: z.string().datetime().describe('The timestamp when the items were borrowed (ISO string).'),
  deadline: z.string().datetime().describe('The deadline for returning the items (ISO string).'),
  returnTime: z.string().datetime().optional().describe('The timestamp when the items were returned (ISO string), if applicable.'),
});

const TransactionLogInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('An array of transaction logs for analysis.'),
});
export type TransactionLogInput = z.infer<typeof TransactionLogInputSchema>;

const AnomalyDetailSchema = z.object({
  transactionId: z.string().describe('The ID of the transaction identified as anomalous.'),
  reason: z.string().describe('A brief explanation of why this transaction is considered suspicious or anomalous.'),
});

const AnomalyDetectionOutputSchema = z.object({
  anomalies: z.array(AnomalyDetailSchema).describe('An array of detected anomalous transactions with explanations.'),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectTransactionAnomalies(input: TransactionLogInput): Promise<AnomalyDetectionOutput> {
  return detectTransactionAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectTransactionAnomaliesPrompt',
  input: { schema: TransactionLogInputSchema },
  output: { schema: AnomalyDetectionOutputSchema },
  prompt: `You are an AI assistant specialized in detecting anomalies in laboratory cabinet transaction logs.
Your task is to review a list of transactions and identify any suspicious activities or potential inventory discrepancies.
Consider the following as potential indicators of anomalies:
- Transactions where the 'deadline' has passed but the 'status' is still 'active'.
- Transactions with unusually high quantities of items borrowed by a single user.
- Transactions where the 'returnTime' is significantly later than the 'deadline' for returned items.
- Any other pattern that suggests an incomplete, incorrect, or suspicious transaction.

For each identified anomaly, provide the 'transactionId' and a clear, concise 'reason' explaining why it is considered suspicious.
If no anomalies are found, return an empty array for 'anomalies'.

Transaction Logs:
{{{json transactions}}}`,
});

const detectTransactionAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectTransactionAnomaliesFlow',
    inputSchema: TransactionLogInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
