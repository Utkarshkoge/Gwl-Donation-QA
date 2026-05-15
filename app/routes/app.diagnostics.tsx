import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  BlockStack,
  Banner,
  List,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Check current webhooks via GraphQL
  const response = await admin.graphql(
    `#graphql
    query {
      webhookSubscriptions(first: 50) {
        edges {
          node {
            id
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    }`
  );

  const jsonResponse = await response.json();
  const webhooks = jsonResponse.data?.webhookSubscriptions?.edges?.map((e: any) => e.node) || [];

  return {
    shop: session.shop,
    scopes: session.scope,
    webhooks,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session, shopify } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "register") {
    try {
      const results = await shopify.registerWebhooks({ session });
      console.log(`[Diagnostics] Manual webhook registration for ${session.shop}:`, results);
      return { success: true, message: "Webhook registration attempt completed. Check server logs for details." };
    } catch (e: any) {
      return { success: false, message: `Registration failed: ${e.message}` };
    }
  }

  return { success: false, message: "Unknown action" };
};

export default function DiagnosticsPage() {
  const { shop, scopes, webhooks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();

  const isLoading = fetcher.state !== "idle";

  return (
    <Page title="App Diagnostics">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Store Information</Text>
              <Text as="p"><strong>Shop:</strong> {shop}</Text>
              <Box paddingBlockStart="200">
                <Text as="p"><strong>Active Scopes:</strong></Text>
                <Text as="p" tone="subdued">{scopes}</Text>
              </Box>
              {!scopes?.includes("read_own_subscription_contracts") && (
                <Banner tone="critical" title="Missing Subscription Scopes">
                  <p>The session does not have the required subscription scopes. Please re-install or update the app to grant permissions.</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="headingMd" as="h2">Registered Webhooks</Text>
                <fetcher.Form method="post">
                  <Button 
                    name="action" 
                    value="register" 
                    variant="primary" 
                    loading={isLoading}
                    submit
                  >
                    Force Webhook Registration
                  </Button>
                </fetcher.Form>
              </div>

              {fetcher.data?.message && (
                <Banner tone={fetcher.data.success ? "success" : "critical"}>
                  <p>{fetcher.data.message}</p>
                </Banner>
              )}

              {webhooks.length > 0 ? (
                <List type="bullet">
                  {webhooks.map((wh: any) => (
                    <List.Item key={wh.id}>
                      <strong>{wh.topic}</strong> → {wh.endpoint.callbackUrl || wh.endpoint.__typename}
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text as="p" tone="subdued">No webhooks found for this app.</Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
