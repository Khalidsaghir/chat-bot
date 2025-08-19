import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

// Fixed Hasura endpoints (removed duplicate "https://" in WS URL)
const HASURA_HTTP = 'https://mxqijdqmvyumzvrcbwxo.hasura.ap-south-1.nhost.run/v1/graphql'
const HASURA_WS = 'wss://mxqijdqmvyumzvrcbwxo.hasura.ap-south-1.nhost.run/v1/graphql'

// Create the HTTP link for queries and mutations
const httpLink = new HttpLink({ uri: HASURA_HTTP })

// Create the WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({ url: HASURA_WS })
)

// Split links: route subscription to wsLink, others to httpLink
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  httpLink
)

// Instantiate Apollo Client
export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
