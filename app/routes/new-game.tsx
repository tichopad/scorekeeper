import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import * as gamesRepository from "~/repositories/games.server";
import { assert } from "~/utils";
import * as E from "fp-ts/Either";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const name = body.get("name");

  assert(name, "Name is required for creating new game");
  assert(typeof name === "string", "Name has to be a string");

  const newGame = await gamesRepository.put({ name });

  if (E.isLeft(newGame)) return json({ errors: newGame.left.errors });

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
