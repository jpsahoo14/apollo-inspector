import {
  ApolloClient,
  ApolloLink,
  NormalizedCacheObject,
} from "@apollo/client";

export const setLinkInFront = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  apolloLink: ApolloLink
) => {
  const currentLink = apolloClient.link;
  const combinedLink = ApolloLink.concat(apolloLink, currentLink);
  apolloClient.setLink(combinedLink);

  return () => {
    apolloClient.setLink(currentLink);
  };
};
