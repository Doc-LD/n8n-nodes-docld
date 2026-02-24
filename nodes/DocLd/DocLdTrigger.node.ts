import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { docldApiRequest } from './GenericFunctions';

export class DocLdTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DocLD Trigger',
		name: 'docLdTrigger',
		icon: 'file:docld.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts a workflow when a DocLD event occurs',
		defaults: {
			name: 'DocLD Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'docLdApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'document.processed',
				options: [
					{
						name: 'Document Processed',
						value: 'document.processed',
						description:
							'Triggers when a document finishes processing (OCR, parsing, chunking)',
					},
					{
						name: 'Document Uploaded',
						value: 'document.uploaded',
						description:
							'Triggers when a new document is uploaded',
					},
					{
						name: 'Extraction Completed',
						value: 'extraction.completed',
						description:
							'Triggers when data extraction finishes',
					},
					{
						name: 'Split Completed',
						value: 'split.completed',
						description:
							'Triggers when a document split job finishes',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				return webhookData.webhookId !== undefined;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const event = this.getNodeParameter('event') as string;

				const body: IDataObject = {
					hookUrl: webhookUrl,
					event,
				};

				const response = (await docldApiRequest.call(
					this,
					'POST',
					'/api/n8n/hooks',
					body,
				)) as IDataObject;

				if (!response.id) {
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = response.id as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookId = webhookData.webhookId as string | undefined;

				if (!webhookId) {
					return true;
				}

				try {
					await docldApiRequest.call(
						this,
						'DELETE',
						`/api/n8n/hooks/${webhookId}`,
					);
				} catch {
					return false;
				}

				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;

		const payload = (body.data as IDataObject) || body;

		return {
			workflowData: [this.helpers.returnJsonArray(payload)],
		};
	}
}
