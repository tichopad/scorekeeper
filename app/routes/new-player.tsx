import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import {
  Schema as PlayerSchema,
  put as putPlayer,
} from "~/models/player.server";
import { validateFormDataAsync } from "~/utils/validation";

const FormSchema = PlayerSchema.pick({ name: true });

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const getResponse = pipe(
    formData,
    validateFormDataAsync(FormSchema),
    TE.chain(({ name }) => putPlayer({ name })),
    TE.match(
      (error) => json({ error }),
      (player) => redirect("/")
    )
  );

  return getResponse();
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
