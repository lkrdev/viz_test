import { ILooker40SDK } from "@looker/sdk";

/**
 * A functional wrapper (Higher-Order Function) that switches the Looker session 
 * to 'dev' mode, executes the callback, and switches back to 'production'.
 * 
 * Use this to wrap SDK calls that require the Development workspace (e.g., 
 * making changes to LookML or project files).
 * 
 * @param sdk The Looker SDK instance
 * @param callback The async function to execute while in dev mode
 */
export const withDevMode = async <T>(sdk: ILooker40SDK, callback: () => Promise<T>): Promise<T> => {
  console.log("[withDevMode] Switching to dev mode");

  // Save current workspace if needed or just switch. 
  // Typically we want to ensure we switch back to production.
  await sdk.ok(sdk.update_session({ workspace_id: "dev" }));

  try {
    return await callback();
  } catch (error) {
    console.error("[withDevMode] Error occurred during dev mode execution:", error);
    throw error;
  } finally {
    console.log("[withDevMode] Switching back to production mode");
    await sdk.ok(sdk.update_session({ workspace_id: "production" }));
  }
}

export interface FileContent {
  path: string;
  content: string;
}

/**
 * Gets the content of a project file.
 * 
 * @param sdk The Looker SDK instance
 * @param project_id The ID of the project
 * @param file_path The path to the file within the project
 */
export async function get_project_file_content(sdk: ILooker40SDK, project_id: string, file_path: string): Promise<string> {
  const path = `/projects/${encodeURIComponent(project_id)}/file/content`;
  const query = { file_path };


  try {
    // We use raw fetch here because the SDK's internal transport incorrectly 
    // attempts to parse the LookML content as JSON (since the server 
    // deceptively returns Content-Type: application/json).
    const token = await sdk.authSession.getToken();
    const baseUrl = sdk.authSession.settings.base_url;
    const url = new URL(`${baseUrl}/api/4.0${path}?file_path=${encodeURIComponent(file_path)}`);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `token ${token.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from Looker:", errorText);
      throw new Error(`Failed to fetch project file: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Error in get_project_file_content:", error);
    throw error;
  }
}

/**
 * Deletes a project file.
 * 
 * @param sdk The Looker SDK instance
 * @param project_id The ID of the project
 * @param file_path The path to the file within the project
 */
export async function delete_project_file(sdk: ILooker40SDK, project_id: string, file_path: string): Promise<void> {
  const path = `/projects/${encodeURIComponent(project_id)}/files`;
  const query = { file_path };
  await sdk.ok(sdk.delete<void, any>(path, query));
}

/**
 * Creates a new project file.
 * 
 * @param sdk The Looker SDK instance
 * @param project_id The ID of the project
 * @param file_content The content and path of the file to create
 */
export async function create_project_file(sdk: ILooker40SDK, project_id: string, file_content: FileContent): Promise<void> {
  const path = `/projects/${encodeURIComponent(project_id)}/files`;
  await sdk.ok(sdk.post<void, any>(path, null, file_content));
}

/**
 * Updates an existing project file.
 * 
 * @param sdk The Looker SDK instance
 * @param project_id The ID of the project
 * @param file_content The content and path of the file to update
 */
export async function update_project_file(sdk: ILooker40SDK, project_id: string, file_content: FileContent): Promise<void> {
  const path = `/projects/${encodeURIComponent(project_id)}/files`;
  const response = await sdk.ok(sdk.put<void, any>(path, null, file_content));
  return response;
}

export async function get_project_manifest(sdk: ILooker40SDK, project_id: string): Promise<string> {
  return get_project_file_content(sdk, project_id, "manifest.lkml");
}