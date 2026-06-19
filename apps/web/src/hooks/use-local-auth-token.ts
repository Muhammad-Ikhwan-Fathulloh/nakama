import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";

export function useRotateLocalAuthToken() {
  return useMutation({
    mutationFn: () => client.rotateLocalAuthToken(),
  });
}
