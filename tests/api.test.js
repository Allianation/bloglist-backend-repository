const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

const Blog = require("../models/blog");

const initialBLogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
];

beforeEach(async () => {
  await Blog.deleteMany({});

  for (const blog of initialBLogs) {
    const blogObject = new Blog(blog);
    await blogObject.save();
  }
});

describe("when there is initially some notes saved", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("the first blog is about React patterns", async () => {
    const response = await api.get("/api/blogs");

    expect(response.body[0].title).toBe("React patterns");
  });

  test("all blogs are returned", async () => {
    const response = await api.get("/api/blogs");

    expect(response.body).toHaveLength(initialBLogs.length);
  });

  test("a specific blog is within the returned blogs", async () => {
    const response = await api.get("/api/blogs");

    const titles = response.body.map((r) => r.title);
    expect(titles).toContain("React patterns");
  });

  test("unique identifier property of the blog is named id", async () => {
    const response = await api.get("/api/blogs");
    response.body.forEach((blog) => {
      expect(blog.id).toBeDefined();
    });
  });
});

describe("addition of a new blog", () => {
  test("success with valid data", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");

    const titles = response.body.map((r) => r.title);

    expect(response.body).toHaveLength(initialBLogs.length + 1);
    expect(titles).toContain("Canonical string reduction");
  });

  test("likes property is missing from the request", async () => {
    const newBlog = {
      title: "First class tests",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    };

    const response = await api.post("/api/blogs").send(newBlog);
    expect(response.body.likes).toBe(0);
  });

  test("title or url properties are missing from the request", async () => {
    const newBlog = {
      author: "Robert C. Martin",
      likes: 2,
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });
});

describe("deletion of a blog", () => {
  test("success with status code 204 if id is valid", async () => {
    const blogsAtStart = await api.get("/api/blogs");
    const blogToDelete = blogsAtStart.body[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await api.get("/api/blogs");

    expect(blogsAtEnd.body).toHaveLength(initialBLogs.length - 1);

    const titles = blogsAtEnd.body.map((r) => r.title);

    expect(titles).not.toContain(blogToDelete.title);
  });
});

describe("updation of a blog", () => {
  test("change likes success", async () => {
    const blogsAtStart = await api.get("/api/blogs");

    const blogToUpdate = {
      title: blogsAtStart.body[0].title,
      author: blogsAtStart.body[0].author,
      url: blogsAtStart.body[0].url,
      likes: 10,
    };

    await api.put(`/api/blogs/${blogsAtStart.body[0].id}`).send(blogToUpdate);

    const blogsAtEnd = await api.get("/api/blogs");

    expect(blogsAtEnd.body[0].likes).toBe(10);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
