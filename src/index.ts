import {
  Canister,
  Err,
  Ok,
  Principal,
  Record,
  Result,
  StableBTreeMap,
  Variant,
  Vec,
  bool,
  ic,
  nat64,
  query,
  text,
  update,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Initialize records.
const User = Record({
  id: Principal,
  name: text,
  email: text,
  createdAt: nat64,
  updatedAt: nat64,
});

const Task = Record({
  id: text,
  title: text,
  description: text,
  isCompleted: bool,
  owner: Principal,
  createdAt: nat64,
  updatedAt: nat64,
});

const UserPayload = Record({
  name: text,
  email: text,
});

const TaskPayload = Record({
  title: text,
  description: text,
});

// Initialize error variants.
const Error = Variant({
  NotFound: text,
  Unauthorized: text,
  Forbidden: text,
  BadRequest: text,
  InternalError: text,
});

// Initialize storages.
const userStorage = StableBTreeMap(Principal, User, 0);
const taskStorage = StableBTreeMap(text, Task, 1);

// Helper function to check if a user exists.
const isUserExists = (id: Principal) => userStorage.containsKey(id);

// Helper function to check if a task exists.
const isTaskExists = (id: string) => taskStorage.containsKey(id);

// Helper function to check if an email is valid.
const isEmailValid = (email: string) => {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
};

// Export the canister.
export default Canister({
  /**
   * Creates a new user.
   * @param payload - Payload for creating a new user.
   * @returns the created user or an error.
   */
  

  /**
   * Retrieves the current user.
   * @returns the current user or an error.
   */
  getMe: query([], Result(User, Error), () => {
  try {
    if (!isUserExists(ic.caller())) {
      return Err({ Unauthorized: 'Invalid operation: User does not exist' });
    }

    const user = userStorage.get(ic.caller());
    return Ok(user.Some);
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),

  /**
   * Updates the current user.
   * @param payload - Payload for updating the current user.
   * @returns the updated user or an error.
   */
  createUser: update([UserPayload], Result(User, Error), (payload) => {
  try {
    if (!payload.name || !payload.email) {
      return Err({ BadRequest: 'Invalid input: Name and email are required' });
    }

    if (!isEmailValid(payload.email)) {
      return Err({ BadRequest: 'Invalid input: Email is not valid' });
    }

    if (isUserExists(ic.caller())) {
      return Err({ BadRequest: 'Invalid input: User already exists' });
    }

    const newUser = {
      id: ic.caller(),
      createdAt: ic.time(),
      updatedAt: ic.time(),
      ...payload,
    };
    userStorage.insert(newUser.id, newUser);
    return Ok(newUser);
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),

  updateMe: update([UserPayload], Result(User, Error), (payload) => {
  try {
    if (!isUserExists(ic.caller())) {
      return Err({ Unauthorized: 'Invalid operation: User does not exist' });
    }

    if (!payload.name || !payload.email) {
      return Err({ BadRequest: 'Invalid input: Name and email are required' });
    }

    if (!isEmailValid(payload.email)) {
      return Err({ BadRequest: 'Invalid input: Email is not valid' });
    }

    const user = userStorage.get(ic.caller()).Some;
    const updatedUser = {
      ...user,
      ...payload,
      updatedAt: ic.time(),
    };
    userStorage.insert(updatedUser.id, updatedUser);
    return Ok(updatedUser);
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),

      // Get user from storage.
      const user = userStorage.get(ic.caller()).Some;

      // Update user, insert it into storage and return it.
      const updatedUser = {
        ...user,
        ...payload,
        updatedAt: ic.time(),
      };
      userStorage.insert(updatedUser.id, updatedUser);
      return Ok(updatedUser);
    } catch (error) {
      // If any error occurs, return it.
      return Err({ InternalError: `${error}` });
    }
  }),

  /**
   * Creates a new task.
   * @param payload - Payload for creating a new task.
   * @returns the created task or an error.
   */
  createTask: update([TaskPayload], Result(Task, Error), (payload) => {
  try {
    if (!isUserExists(ic.caller())) {
      return Err({ Unauthorized: 'Invalid operation: User does not exist' });
    }

    if (!payload.title) {
      return Err({ BadRequest: 'Invalid input: Title is required' });
    }

    const task = {
      id: uuidv4(),
      isCompleted: false,
      owner: ic.caller(),
      createdAt: ic.time(),
      updatedAt: ic.time(),
      ...payload,
    };
    taskStorage.insert(task.id, task);
    return Ok(task);
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),


  /**
   * Retrieves all current user's tasks.
   * @returns the current user's tasks or an error.
   */
  getMyTasks: query([], Result(Vec(Task), Error), () => {
    try {
      // If user does not exist, return error.
      if (!isUserExists(ic.caller())) {
        return Err({ Unauthorized: 'Create an account first' });
      }

      // Return the current user's tasks.
      const filteredTasks = taskStorage
        .values()
        .filter((task: typeof Task) => task.owner.toText() === ic.caller().toText());
      return Ok(filteredTasks);
    } catch (error) {
      // If any error occurs, return it.
      return Err({ InternalError: `${error}` });
    }
  }),

  /**
   * Updates the current user's task.
   * @param id - ID of the task to update.
   * @param payload - Payload for updating the task.
   * @returns the updated task or an error.
   */
  updateMyTask: update([text, TaskPayload], Result(Task, Error), (id, payload) => {
  try {
    if (!isUserExists(ic.caller())) {
      return Err({ Unauthorized: 'Invalid operation: User does not exist' });
    }

    if (!payload.title) {
      return Err({ BadRequest: 'Invalid input: Title is required' });
    }

    if (!isTaskExists(id)) {
      return Err({ NotFound: `Task not found with id ${id}` });
    }

    const task = taskStorage.get(id).Some;

    if (task.owner.toText() !== ic.caller().toText()) {
      return Err({ Forbidden: 'Invalid operation: You are not the task owner' });
    }

    const updatedTask = {
      ...task,
      ...payload,
      updatedAt: ic.time(),
    };
    taskStorage.insert(updatedTask.id, updatedTask);
    return Ok(updatedTask);
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),


  /**
   * Toggles the current user's task completion.
   * @param id - ID of the task to toggle.
   * @returns the toggled task or an error.
   */
  toggleMyTask: update([text], Result(Task, Error), (id) => {
  try {
    if (!isUserExists(ic.caller())) {
      return Err({ Unauthorized: 'Invalid operation: User does not exist' });
    }

    if (!isTaskExists(id)) {
      return Err({ NotFound: `Task not found with id ${id}` });
    }

    const task = taskStorage.get(id).Some;

    if (task.owner.toText() !== ic.caller().toText()) {
      return Err({ Forbidden: 'Invalid operation: You are not the task owner' });
    }

    const toggledTask = {
      ...task,
      isCompleted: !task.isCompleted,
      updatedAt: ic.time(),
    };
    taskStorage.insert(toggledTask.id, toggledTask);
    return Ok(toggledTask);
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),


  /**
   * Deletes the current user's task.
   * @param id - ID of the task to delete.
   * @returns a message or an error.
   */
  deleteMyTask: update([text], Result(text, Error), (id) => {
  try {
    if (!isUserExists(ic.caller())) {
      return Err({ Unauthorized: 'Invalid operation: User does not exist' });
    }

    if (!isTaskExists(id)) {
      return Err({ NotFound: `Task not found with id ${id}` });
    }

    const task = taskStorage.get(id).Some;

    if (task.owner.toText() !== ic.caller().toText()) {
      return Err({ Forbidden: 'Invalid operation: You are not the task owner' });
    }

    taskStorage.remove(task.id);
    return Ok('Task deleted successfully');
  } catch (error) {
    return Err({ InternalError: 'Internal server error' });
  }
}),

// A workaround to make uuid package work with Azle.
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
