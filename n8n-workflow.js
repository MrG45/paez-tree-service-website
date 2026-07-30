import { workflow, node, trigger, newCredential, expr, languageModel, tool, outputParser, fromAi, merge } from '@n8n/workflow-sdk';

// ===== WEBHOOK TRIGGER =====
const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Quote Received',
    parameters: {
      httpMethod: 'POST',
      path: 'paez-quote',
      options: {
        rawBody: false,
        responseData: 'json',
        responseMode: 'onReceived'
      }
    }
  }
});

// ===== FORMAT INCOMING DATA =====
const formatData = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Format Lead Data',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'lead-name', name: 'leadName', value: expr('{{ $json.body.name }}'), type: 'string' },
          { id: 'lead-phone', name: 'leadPhone', value: expr('{{ $json.body.phone }}'), type: 'string' },
          { id: 'lead-email', name: 'leadEmail', value: expr('{{ $json.body.email }}'), type: 'string' },
          { id: 'lead-service', name: 'leadService', value: expr('{{ $json.body.service }}'), type: 'string' },
          { id: 'received-at', name: 'receivedAt', value: expr('{{ $now.toISO() }}'), type: 'string' }
        ]
      }
    }
  }
});

// ===== AI MODEL (Ollama local) =====
const ollamaModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOllama',
  version: 1.4,
  config: {
    name: 'Ollama',
    parameters: {
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
      temperature: 0.3
    }
  }
});

// ===== HTTP REQUEST TOOL (for web search) =====
const searchTool = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 1,
  config: {
    name: 'Search Web',
    parameters: {
      method: 'GET',
      url: 'https://www.google.com/search?q={{ encodeURIComponent($json.query) }}'
    }
  }
});

// ===== AI AGENT - Lead Enrichment =====
const aiAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'AI Lead Enricher',
    parameters: {
      promptType: 'define',
      text: `You are a lead enrichment researcher for Paez Tree Service, a tree service company in Anaheim, CA.

You will receive a lead's name, phone, and email. Your job is to research them and build a profile.

Search the web for:
1. The person's name + "Anaheim" or "Orange County" — look for social profiles, business affiliations, reviews
2. Their phone number — look for associated names, reviews, or business listings
3. Their email — look for any associated accounts or profiles

Compile your findings into a structured profile:
- Full name
- Phone number (verified)
- Email
- Possible location / neighborhood
- Social profiles found (LinkedIn, Facebook, etc.)
- Business or employer (if found)
- Property type (house, condo, commercial) — infer from search results
- Estimated property value (if found)
- Notes on tree-related needs (large trees, multiple trees, palms, etc.)
- Any reviews or complaints found
- Lead quality score (Hot / Warm / Cold) based on: property type, tree density, location, responsiveness

Always respond in JSON format with the fields above. If you can't find something, put "Not found".`
    },
    subnodes: {
      model: ollamaModel,
      tools: [searchTool]
    }
  }
});

// ===== STORE ENRICHED LEAD =====
const storeLead = node({
  type: 'n8n-nodes-base.dataTable',
  version: 2.3,
  config: {
    name: 'Store Lead',
    parameters: {
      operation: 'appendOrCreate',
      tableName: 'paez-leads',
      columns: {
        columns: [
          { name: 'receivedAt', type: 'string' },
          { name: 'leadName', type: 'string' },
          { name: 'leadPhone', type: 'string' },
          { name: 'leadEmail', type: 'string' },
          { name: 'leadService', type: 'string' },
          { name: 'enrichedProfile', type: 'string' },
          { name: 'leadScore', type: 'string' }
        ]
      },
      data: {
        data: [
          {
            field: 'receivedAt',
            value: expr('{{ $json.receivedAt }}')
          },
          {
            field: 'leadName',
            value: expr('{{ $json.leadName }}')
          },
          {
            field: 'leadPhone',
            value: expr('{{ $json.leadPhone }}')
          },
          {
            field: 'leadEmail',
            value: expr('{{ $json.leadEmail }}')
          },
          {
            field: 'leadService',
            value: expr('{{ $json.leadService }}')
          },
          {
            field: 'enrichedProfile',
            value: expr('{{ $json.output }}')
          },
          {
            field: 'leadScore',
            value: 'New'
          }
        ]
      }
    }
  }
});

// ===== RESPOND TO WORDPRESS =====
const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 2.1,
  config: {
    name: 'Respond to Form',
    parameters: {
      respondWith: 'json',
      options: {},
      responseBody: expr('{{ { "status": "received", "leadName": $json.leadName } }}')
    }
  }
});

// ===== COMPOSE WORKFLOW =====
export default workflow('paez-lead-enrichment', 'Paez - Lead Enrichment')
  .add(webhookTrigger)
  .to(formatData)
  .to(aiAgent)
  .to(storeLead)
  .to(respond);