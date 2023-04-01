import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { put as putPlayer } from "~/models/player.server";
import { assert } from "~/utils";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const name = body.get("name");

  assert(name, "Name is required for creating new game");
  assert(typeof name === "string", "Name has to be a string");

  const newPlayer = await putPlayer({ name });

  return pipe(
    newPlayer,
    E.match(
      (error) => json({ error }),
      () => redirect("/")
    )
  );
};

export default function CreateNewPlayer() {
  return (
    <main>
      <h1>Create new player</h1>
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
