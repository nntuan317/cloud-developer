import { TodosAccess } from './todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { TodoUpdate } from '../models/TodoUpdate';
import { createLogger } from '../utils/logger'

const logger = createLogger('todos')

const todoAccess = new TodosAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
    return await todoAccess.getTodos(userId)
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {
    const todoId = uuid.v4()

    return await todoAccess.createTodo({
        todoId: todoId,
        userId: userId,
        createdAt: new Date().toISOString(),
        ...createTodoRequest,
        done: false,
        attachmentUrl: ''
    })
}

export async function updateTodo(
    userId:string,
    todoId: string,
    updateToDoRequest: UpdateTodoRequest
) {
    const validTodoId: Boolean = await todoAccess.isTodoExists(userId, todoId)
    if (!validTodoId) {
        throw new Error('ToDo item does not exist')
    }

    const updatedToDo: TodoUpdate = {
        name: updateToDoRequest.name,
        dueDate: updateToDoRequest.dueDate,
        done: updateToDoRequest.done
    }

    return await todoAccess.updateTodo(userId, todoId, updatedToDo)
}

export async function deleteTodo(userId:string, todoId: string) {
    const validTodoId = await todoAccess.isTodoExists(userId, todoId)
    if (!validTodoId) {
        logger.info('Delete: cannot find item id')
        throw new Error('ToDo item does not exist')
    }

    return await todoAccess.deleteTodo(userId, todoId)
}

export async function updateImageUrl(userId:string, todoId: string, bucketName: string) {
    const url: string = `https://${bucketName}.s3.amazonaws.com/${todoId}`
    await todoAccess.updateAttachmentUrl(userId, todoId, url)
}

