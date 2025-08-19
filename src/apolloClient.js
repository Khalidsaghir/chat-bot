import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { nhost } from './nhost';

// Hasura GraphQL endpoint
const httpLink = createHttpLink({
  uri: 'https://mxqijdqmvyumzvrcbwxo.hasura.ap-south-1.nhost.run/v1/graphql', // your Hasura endpoint
});

// Middleware to attach JWT token from Nhost to every request header
const authLink = setContext((_, { headers }) => {
  const token = nhost.auth.getAccessToken(); // get JWT token from Nhost
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '', // attach token if exists
    },
  };
});

// Apollo Client instance with auth middleware and cache
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
