const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB error at: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

const priorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// GET API

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case priorityAndStatusProperty(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          todo LIKE "%${search_q}%"
          AND priority = "${priority}
          AND status = "${status}";`;
      break;

    case priorityProperty(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          todo LIKE "%${search_q}%"
          AND priority = "${priority}";`;
      break;

    case statusProperty(request.query):
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE
          todo LIKE "%${search_q}%"
          AND status = "${status}";`;
      break;

    default:
      getTodoQuery = `
          SELECT *
          FROM todo
          WHERE todo LIKE "%${search_q}%"`;
  }

  data = await database.all(getTodoQuery);
  response.send(data);
});

// GET todo based on id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getTodoIdQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;

  const todoId1 = await database.get(getTodoIdQuery);

  response.send(todoId1);
});

// create todo

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `
    INSERT INTO 
    todo(id, todo, priority, status)
    VALUES(${id}, "${todo}", "${priority}", "${status}");`;

  await database.run(createTodo);

  response.send("Todo Successfully Added");
});

// update todo

app.put("/todos/:todoId/", async (request, response) => {
  //   const { status } = request.body;
  //   const { todoId } = request.params;
  //   const updateTodo = `
  //     UPDATE todo
  //     SET status = "${status}"
  //     WHERE id = ${todoId};`;

  //   await database.run(updateTodo);

  //   response.send("Todo Updated");
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// delete todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
    DELETE FROM todo WHERE id = ${todoId};`;

  await database.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
