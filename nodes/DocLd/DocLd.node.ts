import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { docldApiRequest } from './GenericFunctions';

export class DocLd implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DocLD',
		name: 'docLd',
		icon: 'file:docld.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Upload, parse, extract, and search documents with DocLD',
		defaults: {
			name: 'DocLD',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'docLdApi',
				required: true,
			},
		],
		properties: [
			// ── Resource ──────────────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Document', value: 'document' },
					{ name: 'Extraction', value: 'extraction' },
				],
				default: 'document',
			},

			// ── Document Operations ───────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['document'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a document by ID',
						action: 'Get a document',
					},
					{
						name: 'Parse',
						value: 'parse',
						description: 'Parse a document to extract text, tables, and structure',
						action: 'Parse a document',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search documents by name, status, or file type',
						action: 'Search documents',
					},
					{
						name: 'Upload',
						value: 'upload',
						description: 'Upload a document from a URL',
						action: 'Upload a document',
					},
				],
				default: 'upload',
			},

			// ── Extraction Operations ─────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['extraction'] } },
				options: [
					{
						name: 'Run',
						value: 'run',
						description: 'Extract structured data from a document',
						action: 'Run an extraction',
					},
				],
				default: 'run',
			},

			// ── Document: Upload ──────────────────────────────────────
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com/invoice.pdf',
				description: 'Public URL of the file to upload',
				displayOptions: {
					show: { resource: ['document'], operation: ['upload'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['document'], operation: ['upload'] },
				},
				options: [
					{
						displayName: 'Knowledge Base ID',
						name: 'knowledgeBaseId',
						type: 'string',
						default: '',
						description: 'Add the document to a knowledge base',
					},
					{
						displayName: 'Organization ID',
						name: 'organizationId',
						type: 'string',
						default: '',
						description: 'Associate the document with an organization',
					},
				],
			},

			// ── Document: Get ─────────────────────────────────────────
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				required: true,
				default: '',
				description: 'UUID of the document to retrieve',
				displayOptions: {
					show: { resource: ['document'], operation: ['get'] },
				},
			},

			// ── Document: Search ──────────────────────────────────────
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Search documents by name',
				displayOptions: {
					show: { resource: ['document'], operation: ['search'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['document'], operation: ['search'] },
				},
				options: [
					{
						displayName: 'File Type',
						name: 'fileType',
						type: 'string',
						default: '',
						placeholder: 'application/pdf',
						description: 'Filter by MIME type',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 10,
						description: 'Max number of results to return',
						typeOptions: { minValue: 1, maxValue: 100 },
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Completed', value: 'completed' },
							{ name: 'Failed', value: 'failed' },
							{ name: 'Processing', value: 'processing' },
							{ name: 'Uploaded', value: 'uploaded' },
						],
						description: 'Filter by processing status',
					},
				],
			},

			// ── Document: Parse ───────────────────────────────────────
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				required: true,
				default: '',
				description: 'UUID of the document to parse',
				displayOptions: {
					show: { resource: ['document'], operation: ['parse'] },
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: { resource: ['document'], operation: ['parse'] },
				},
				options: [
					{
						displayName: 'Enable OCR',
						name: 'ocrEnabled',
						type: 'boolean',
						default: false,
						description: 'Whether to force OCR processing for scanned documents',
					},
					{
						displayName: 'Extract Tables',
						name: 'extractTables',
						type: 'boolean',
						default: false,
						description: 'Whether to extract tabular data from the document',
					},
				],
			},

			// ── Extraction: Run ───────────────────────────────────────
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				required: true,
				default: '',
				description: 'UUID of the document to extract data from',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['run'] },
				},
			},
			{
				displayName: 'Schema ID',
				name: 'schemaId',
				type: 'string',
				default: '',
				description:
					'ID of a saved extraction schema. Leave empty to use Schema Description instead.',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['run'] },
				},
			},
			{
				displayName: 'Schema Description',
				name: 'schemaDescription',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				placeholder:
					'Extract vendor name, invoice number, and total amount',
				description:
					'Natural-language description of what to extract. Used when Schema ID is not provided.',
				displayOptions: {
					show: { resource: ['extraction'], operation: ['run'] },
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];

				// ── Document ──────────────────────────────────────────
				if (resource === 'document') {
					if (operation === 'upload') {
						responseData = await executeUpload.call(this, i);
					} else if (operation === 'get') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						responseData = (await docldApiRequest.call(
							this,
							'GET',
							`/api/documents/${documentId}`,
						)) as IDataObject;
					} else if (operation === 'search') {
						responseData = await executeSearch.call(this, i);
					} else if (operation === 'parse') {
						responseData = await executeParse.call(this, i);
					} else {
						throw new Error(`Unknown document operation: ${operation}`);
					}
				}
				// ── Extraction ────────────────────────────────────────
				else if (resource === 'extraction') {
					if (operation === 'run') {
						responseData = await executeExtraction.call(this, i);
					} else {
						throw new Error(`Unknown extraction operation: ${operation}`);
					}
				} else {
					throw new Error(`Unknown resource: ${resource}`);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// ── Operation helpers ─────────────────────────────────────────────────

async function executeUpload(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const fileUrl = this.getNodeParameter('fileUrl', itemIndex) as string;
	const additionalFields = this.getNodeParameter(
		'additionalFields',
		itemIndex,
	) as IDataObject;

	const credentials = await this.getCredentials('docLdApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

	const fileBuffer = (await this.helpers.httpRequest({
		method: 'GET',
		url: fileUrl,
		returnFullResponse: false,
		encoding: 'arraybuffer',
	})) as Buffer;

	const filename = fileUrl.split('/').pop() || 'document';

	const formData = new FormData();
	formData.append('file', new Blob([fileBuffer]), filename);

	if (additionalFields.knowledgeBaseId) {
		formData.append('knowledge_base_id', additionalFields.knowledgeBaseId as string);
	}
	if (additionalFields.organizationId) {
		formData.append('organization_id', additionalFields.organizationId as string);
	}

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'docLdApi',
		{
			method: 'POST',
			url: `${baseUrl}/api/upload`,
			body: formData,
		},
	)) as IDataObject;

	const doc = (response.document as IDataObject) || response;
	return {
		id: (doc.id || response.file_id) as string,
		name: (doc.name || filename) as string,
		file_type: (doc.file_type || response.mime_type) as string,
		status: (doc.status || 'processing') as string,
	};
}

async function executeSearch(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject[]> {
	const query = this.getNodeParameter('query', itemIndex) as string;
	const additionalFields = this.getNodeParameter(
		'additionalFields',
		itemIndex,
	) as IDataObject;

	const qs: IDataObject = {};
	if (query) qs.query = query;
	if (additionalFields.status) qs.status = additionalFields.status;
	if (additionalFields.fileType) qs.file_type = additionalFields.fileType;
	qs.limit = (additionalFields.limit as number) || 10;

	const response = await docldApiRequest.call(this, 'GET', '/api/documents', {}, qs);

	if (Array.isArray(response)) return response;
	const data = response as IDataObject;
	return (data.documents as IDataObject[]) || [];
}

async function executeParse(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;
	const additionalFields = this.getNodeParameter(
		'additionalFields',
		itemIndex,
	) as IDataObject;

	const body: IDataObject = { document_id: documentId };
	const advancedOptions: IDataObject = {};

	if (additionalFields.ocrEnabled !== undefined) {
		advancedOptions.ocr = additionalFields.ocrEnabled;
	}
	if (additionalFields.extractTables !== undefined) {
		advancedOptions.extract_tables = additionalFields.extractTables;
	}
	if (Object.keys(advancedOptions).length > 0) {
		body.advanced_options = advancedOptions;
	}

	const response = (await docldApiRequest.call(
		this,
		'POST',
		'/api/parse',
		body,
	)) as IDataObject;

	const result = (response.result as IDataObject) || response;
	const usage = (response.usage as IDataObject) || {};

	return {
		chunks: JSON.stringify(result.chunks ?? response.chunks ?? []),
		pages: (usage.num_pages ?? usage.pages ?? response.pages ?? 0) as number,
		credits: (usage.credits ?? response.credits ?? 0) as number,
	};
}

async function executeExtraction(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;
	const schemaId = this.getNodeParameter('schemaId', itemIndex) as string;
	const schemaDescription = this.getNodeParameter(
		'schemaDescription',
		itemIndex,
	) as string;

	const body: IDataObject = { document_id: documentId };
	if (schemaId) body.schema_id = schemaId;
	if (schemaDescription) body.schema_description = schemaDescription;

	const response = (await docldApiRequest.call(
		this,
		'POST',
		'/api/extract/run',
		body,
	)) as IDataObject;

	return {
		extraction_id: (response.extraction_id || response.job_id) as string,
		document_id: documentId,
		fields:
			typeof response.data === 'object'
				? JSON.stringify(response.data)
				: String(response.data || '{}'),
		confidence: (response.overall_confidence ??
			response.confidence ??
			0) as number,
	};
}
