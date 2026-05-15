import { unauthenticated } from './app/shopify.server';

async function run() {
  const shop = 'gwl-apps-demo.myshopify.com';
  const contractId = 'gid://shopify/SubscriptionContract/32467812599';
  
  console.log('--- Starting Recovery Test ---');
  console.log('Target Shop:', shop);
  console.log('Contract ID:', contractId);
  
  const { admin } = await unauthenticated.admin(shop);
  
  const mutation = `#graphql
    mutation testRecoveryFlow($id: ID!) {
      subscriptionBillingAttemptCreate(
        subscriptionContractId: $id,
        subscriptionBillingAttemptInput: {
          idempotencyKey: "test_${Date.now()}"
        }
      ) {
        subscriptionBillingAttempt {
          id
          errorMessage
          errorCode
        }
        userErrors { field message }
      }
    }
  `;

  try {
    const response = await admin.graphql(mutation, { variables: { id: contractId } });
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

run();
