import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

const todoIdIndex = process.env.TODOS_CREATED_AT_INDEX

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todoTable = process.env.TODOS_TABLE) {
    }

    async getTodos(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all ToDo Items for userId = ${userId}`)
        const result = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: todoIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info('Creating ToDo Item')
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todoItem
        }).promise()

        return todoItem
    }

    async isTodoExists(userId:string, todoId: string): Promise<Boolean> {
        logger.info(`Getting ToDo item, todoId = ${todoId}`)

        const result = await this.docClient
            .get({
                TableName: this.todoTable,
                Key: {
                    userId: userId,
                    todoId: todoId
                }
            }).promise()

        return !!result.Item
    }

    async updateTodo(userId:string, todoId: string, todoUpdate: TodoUpdate) {
        logger.info(`Updating ToDo Item, todoId = ${todoId}`)
        await this.docClient.update({
            TableName: this.todoTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'set #namefield = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeNames: {
                "#namefield": "name"
            },
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done
            }
        }).promise()
    }

    async updateAttachmentUrl(userId:string, todoId: string, url: string) {
        logger.info(`Updating image URL = ${url} with todoId = ${todoId}`)
        await this.docClient.update({
            TableName: this.todoTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'set #attachmentURLField = :url',
            ExpressionAttributeNames: {
                '#attachmentURLField': 'attachmentUrl'
            },
            ExpressionAttributeValues: {
                ':url': url
            },
        }).promise()
    }

    async deleteTodo(userId: string, todoId: string) {
        logger.info(`Deleting ToDo Item, todoId = ${todoId}`)
        const param = {
            TableName: this.todoTable,
            Key: {
                userId: userId,
                todoId: todoId
            }
        }
        await this.docClient.delete(param).promise()
    }
}