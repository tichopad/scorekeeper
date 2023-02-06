import { redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { createGame } from "~/repositories/leaderboards.server";
import { assert } from "~/utils";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const name = body.get("name");

  assert(name, "Name is required for creating new game");
  assert(typeof name === "string", "Name has to be a string");

  await createGame(name);

  return redirect("/");
};

export default function NewGame() {
  return (
    <main>
      <h1>Create new game</h1>
      <Form method="post">
        <label>
          Name
          <br />
          <input type="text" name="name" required />
        </label>
        <button type="submit">Create</button>
      </Form>
    </main>
  );
}
