export const register = (req, res) => {
  res.json({ message: "User registered successfully" });
};

export const login = (req, res) => {
  res.json({ token: "fake-jwt-token" });
};

export const getProfile = (req, res) => {
  res.json({ id: 1, name: "John Doe", role: "student" });
};
