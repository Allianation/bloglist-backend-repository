const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

const helper = require("./test_helper");
const Blog = require("../models/blog");
const bcrypt = require("bcrypt");
const User = require("../models/user");

beforeEach(async () => {
  await Blog.deleteMany({});

  for (const blog of helper.initialBlogs) {
    const blogObject = new Blog(blog);
    await blogObject.save();
  }
});

describe("when there is initially some blogs saved", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("the first blog is about React patterns", async () => {
    const response = await helper.blogsInDb();

    expect(response[0].title).toBe("React patterns");
  });

  test("all blogs are returned", async () => {
    const response = await helper.blogsInDb();

    expect(response).toHaveLength(helper.initialBlogs.length);
  });

  test("a specific blog is within the returned blogs", async () => {
    const response = await helper.blogsInDb();

    const titles = response.map((r) => r.title);
    expect(titles).toContain("React patterns");
  });

  test("unique identifier property of the blog is named id", async () => {
    const response = await helper.blogsInDb();
    response.forEach((blog) => {
      expect(blog.id).toBeDefined();
    });
  });
});

describe("addition of a new blog", () => {
  test("success with valid data", async () => {
    const users = await helper.usersInDb();

    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
      userId: users[0].id,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await helper.blogsInDb();

    const titles = response.map((r) => r.title);

    expect(response).toHaveLength(helper.initialBlogs.length + 1);
    expect(titles).toContain("Canonical string reduction");
  });

  test("likes property is missing from the request", async () => {
    const users = await helper.usersInDb();

    const newBlog = {
      title: "First class tests",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
      userId: users[0].id,
    };

    const response = await api.post("/api/blogs").send(newBlog);
    expect(response.body.likes).toBe(0);
  });

  test("title or url properties are missing from the request", async () => {
    const users = await helper.usersInDb();

    const newBlog = {
      author: "Robert C. Martin",
      likes: 2,
      userId: users[0].id,
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });
});

describe("deletion of a blog", () => {
  test("success with status code 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

    const titles = blogsAtEnd.map((r) => r.title);

    expect(titles).not.toContain(blogToDelete.title);
  });
});

describe("updation of a blog", () => {
  test("change likes success", async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToUpdate = {
      title: blogsAtStart[0].title,
      author: blogsAtStart[0].author,
      url: blogsAtStart[0].url,
      likes: 10,
    };

    await api.put(`/api/blogs/${blogsAtStart[0].id}`).send(blogToUpdate);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd[0].likes).toBe(10);
  });
});

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation success with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "allianation",
      name: "Sergio Alliana",
      password: "password",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test("all users are returned", async () => {
    const response = await helper.usersInDb();

    expect(response).toHaveLength(1);
  });
});

describe("addition of a new user", () => {
  test("username must be unique", async () => {
    const newUser = {
      username: "root",
      name: "Sergio Alliana",
      password: "password",
    };

    const response = await api.post("/api/users").send(newUser).expect(400);

    expect(response.body.error).toContain("User validation failed: username: Error, expected `username` to be unique. Value: `root`");
  });

  test("username or password properties are missing from the request", async () => {
    const newUser = {
      name: "Sergio Alliana",
    };

    await api.post("/api/users").send(newUser).expect(400);
  });

  test("username and password must be at least 3 characters long", async () => {
    const newUser = {
      username: "al",
      name: "Sergio Alliana",
      password: "pa",
    };

    await api.post("/api/users").send(newUser).expect(400);
  });

});

afterAll(() => {
  mongoose.connection.close();
});
