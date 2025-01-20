import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as fs from 'fs';
import * as path from 'path';

export async function uploadFile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`File upload function processed request for url "${request.url}"`);

    if (request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file') as unknown as File;

        if (file) {
            const allowedMimeTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
            if (!allowedMimeTypes.includes(file.type)) {
                return { body: `Please upload an Excel or CSV file.` };
            }

            const filePath = path.join('./files', file.name);
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            fs.writeFileSync(filePath, fileBuffer);

            return { body: `File uploaded successfully!` };
        } else {
            return { body: `No file found in the request.` };
        }
    } else {
        return { body: `Please use POST method to upload files.` };
    }
};

app.http('uploadFile', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: uploadFile
});