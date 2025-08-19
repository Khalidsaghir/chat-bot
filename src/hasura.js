const HASURA_ENDPOINT = "https://mxqijdqmvyumzvrcbwxo.hasura.ap-south-1.nhost.run/v1/graphql";
const HASURA_ADMIN_SECRET = "t(8@-$7'rDfM_Zu$,stdbcoX*ucEnfRI";

/**
 * Generic function to call Hasura GraphQL.
 * @param {string} query - GraphQL query or mutation string
 * @param {object} variables - Variables object
 * @param {string} token - Optional Nhost JWT token for user authentication
 * @returns {Promise<object>} - GraphQL response data
 */
export async function fetchHasura(query, variables = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(HASURA_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();

  if (data.errors) {
    console.error("Hasura Error:", data.errors);
    throw new Error(data.errors.map(e => e.message).join(", "));
  }

  return data.data; // Return only data part to simplify usage
}

/**
 * Fetch all chats for a user.
 * @param {string} user_id - UUID of the user
 * @param {string} token - Optional JWT token
 */
export async function getChats(user_id, token) {
  return fetchHasura(
    `
    query GetChats($user_id: uuid!) {
      chats(where: { user_id: { _eq: $user_id } }) {
        id
        name
      }
    }
    `,
    { user_id },
    token
  );
}

/**
 * Fetch messages for a chat.
 * @param {string} chat_id - UUID of the chat
 * @param {string} token - Optional JWT token
 */
export async function getMessages(chat_id, token) {
  return fetchHasura(
    `
    query GetMessages($chat_id: uuid!) {
      messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) {
        id
        content
        user_id
        created_at
      }
    }
    `,
    { chat_id },
    token
  );
}

/**
 * Insert a new message (user message).
 * @param {string} chat_id
 * @param {string} content
 * @param {string} user_id
 * @param {string} token
 */
export async function insertMessage(chat_id, content, user_id, token) {
  return fetchHasura(
    `
    mutation InsertMessage($chat_id: uuid!, $content: String!, $user_id: uuid!) {
      insert_messages_one(object: { chat_id: $chat_id, content: $content, user_id: $user_id }) {
        id
        content
      }
    }
    `,
    { chat_id, content, user_id },
    token
  );
}

/**
 * Call Hasura action to send message to chatbot.
 * @param {string} chat_id
 * @param {string} content
 * @param {string} token
 */
export async function sendMessageAction(chat_id, content, token) {
  return fetchHasura(
    `
    mutation SendMessage($chat_id: uuid!, $content: String!) {
      sendMessage(chat_id: $chat_id, content: $content) {
        reply
      }
    }
    `,
    { chat_id, content },
    token
  );
}

/**
 * Create a new chat.
 * @param {string} name
 * @param {string} user_id
 * @param {string} token
 */
export async function createChat(name, user_id, token) {
  return fetchHasura(
    `
    mutation CreateChat($name: String!, $user_id: uuid!) {
      insert_chats_one(object: { name: $name, user_id: $user_id }) {
        id
        name
      }
    }
    `,
    { name, user_id },
    token
  );
}

/**
 * Delete a chat.
 * @param {string} chat_id
 * @param {string} token
 */
export async function deleteChat(chat_id, token) {
  return fetchHasura(
    `
    mutation DeleteChat($chat_id: uuid!) {
      delete_chats_by_pk(id: $chat_id) {
        id
      }
    }
    `,
    { chat_id },
    token
  );
}

/**
 * Update a chat name.
 * @param {string} chat_id
 * @param {string} name
 * @param {string} token
 */
export async function updateChatName(chat_id, name, token) {
  return fetchHasura(
    `
    mutation UpdateChat($chat_id: uuid!, $name: String!) {
      update_chats_by_pk(pk_columns: { id: $chat_id }, _set: { name: $name }) {
        id
        name
      }
    }
    `,
    { chat_id, name },
    token
  );
}
