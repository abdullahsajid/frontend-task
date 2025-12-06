namespace UserService {
  export const chat = async (prompt: string,context?:string) => {
    return fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, context }),
    })
  };
}

export default UserService;
