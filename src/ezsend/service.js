const axios = require("axios");
const base64 = require("base-64");
const fs = require("fs");


const config = {
  apiSecret:
    typeof process.env.CONFIG_API_SECRET === "undefined"
        ? "[Inserir App Secret]"
        : process.env.CONFIG_API_SECRET,
  apiId:
    typeof process.env.CONFIG_API_ID === "undefined"
        ? "[Inserir App Id]"
        : process.env.CONFIG_API_ID,
  fieldIDRequester:   
    typeof process.env.CONFIG_FIELD_ID_REQUESTER === "undefined"
        ? "[Inserir Id de Campo de solicitante]"
        : process.env.CONFIG_FIELD_ID_REQUESTER,
  fieldIDSubject:
    typeof process.env.CONFIG_FIELD_ID_SUBJECT === "undefined"
        ? "[Inserir Id de Campo de titulo]"
        : process.env.CONFIG_FIELD_ID_SUBJECT,
}


const sunco = (suncoConfig) => {
  const AxiosInstance = axios.create({
    baseURL: `https://api.smooch.io/v2/apps/${suncoConfig['appId']}`,
    headers: {
      'Authorization': `Basic ${suncoConfig['auth']}`
    }
  })

  return AxiosInstance
}
const passControl = async (webhookPayload) => {
  console.log(webhookPayload)
 
  const SuncoConfig = {
    appId: webhookPayload['app']['_id'],
    auth: base64.encode(`${config.apiId}:${config.apiSecret}`)
  }
  const ConversationId = webhookPayload['matchResult']['conversation']['_id']

  const ConversationMessages = await _getSuncoConversationMessages(SuncoConfig, ConversationId);
  const LastMessage = ConversationMessages.pop();

  const SuncoParamsEncoded = LastMessage['author']['avatarUrl'].split('suncoParams=').length === 2 ? LastMessage['author']['avatarUrl'].split('suncoParams=')[1] : [];
  const SuncoParams = SuncoParamsEncoded.length ? JSON.parse(base64.decode(SuncoParamsEncoded))  : null;

  if(!SuncoParams['createTicket']){
    const Response = {
      status: 'Success',
      code: 200,
      data: 'Ticket proativo não sera criado'
    }
  
    return Response;
  }

  const metadata = {
    [`dataCapture.ticketField.${config.fieldIDRequester}`]: `${SuncoParams['userId']}`,
    [`dataCapture.ticketField.${config.fieldIDSubject}`]: `${SuncoParams['ticketTitle']}`,
    "dataCapture.systemField.assignee_id": SuncoParams['agendId'],
    "dataCapture.systemField.tags": `sunco_proactive_notifications template_name:${SuncoParams['templateName']} template_category:${SuncoParams['templateCategory']} ${SuncoParams['ticketTag']} `,
    first_message_id: LastMessage['id'],
  }

  const Data = {
    switchboardIntegration: SuncoParams['switchboardIntegration'],
    metadata,
  };

  await _passControlAPICall(SuncoConfig, ConversationId, Data);
  
  const Response = {
    status: 'Success',
    code: 200,
    data: 'Ticket proativo criado'
  }

  return Response;
};

const _getSuncoConversationMessages = async (suncoConfig, conversationId) => {
  const Response = await _getSuncoConversationsMessagesAPICall(suncoConfig, conversationId);
  return Response
}

const _passControlAPICall = async (suncoConfig, conversationId, data) => {
  try{

    const Response = await sunco(suncoConfig).post(`/conversations/${conversationId}/passControl`, data).then(res => {
      return res.data
    }).catch(err => {
      throw err
    });

    return Response
  }
  catch(err){
    const ErrObj = {
      status: 'Error',
      code: err.response.status,
      data: err.response.data
    }
    throw ErrObj
  }
}

const _getSuncoConversationsMessagesAPICall = async (suncoConfig, conversationId) => {
  try{

    const Response = await sunco(suncoConfig).get(`/conversations/${conversationId}/messages`).then(res => {
      return res.data['messages']
    }).catch(err => {
      throw err
    });

    return Response
  }
  catch(err){
    const ErrObj = {
      status: 'Error',
      code: err.response.status,
      data: err.response.data
    }
    throw ErrObj
  }
}

module.exports = {
  passControl,
};
