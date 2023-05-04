import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { Schema as GameSchema, put as putGame } from "~/models/game.server";
import { validateFormDataAsync } from "~/utils/validation";

const FormSchema = GameSchema.pick({ name: true });

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const getResponse = pipe(
    formData,
    validateFormDataAsync(FormSchema),
    TE.chain(({ name }) => putGame({ name, leaderboard: [] })),
    TE.match(
      (error) => json({ error }),
      (game) => redirect("/")
    )
  );

  return getResponse();
};

export default function CreateNewGame() {
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
