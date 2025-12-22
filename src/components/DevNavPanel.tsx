import { useState } from "react";
import { Download, Upload, Trash2, Sun, Moon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

export function DevNavPanel() {
  const {
    tokens,
    addToken,
    removeToken,
    exportConfig,
    importConfig,
    clearAll,
  } = useAppContext();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    key: "",
    value: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importConfig(file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation with Sonner toast errors
    if (!formData.key.trim()) {
      toast.error("Token key is required");
      return;
    }

    if (!formData.value.trim()) {
      toast.error("Token value is required");
      return;
    }

    // Check if key already exists
    if (tokens[formData.key]) {
      toast.error(`Token '${formData.key}' already exists`);
      return;
    }

    try {
      await addToken(formData.key, formData.value);
      setFormData({ key: "", value: "" });
      toast.success(`Token '${formData.key}' added successfully`);
    } catch (error) {
      toast.error("Failed to add token");
    }
  };

  const handleDeleteToken = (key: string) => {
    removeToken(key);
    toast.success(`Token '${key}' deleted successfully`);
    setDeleteDialogOpen(null);
  };

  return (
    <Card>
      {/* Header with title and actions */}
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-semibold">DevNav</CardTitle>

          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              onClick={exportConfig}
              title="Export Configuration"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleImportClick}
              title="Import Configuration"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  title="Clear All Data"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAll}
                    className="bg-destructive "
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title="Toggle Dark/Light Mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </ButtonGroup>
        </div>
      </CardHeader>

      <CardContent>
        {/* Token input form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <Input
              value={formData.key}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, key: e.target.value }))
              }
              placeholder="token"
              className="flex-1"
            />
            <Input
              value={formData.value}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, value: e.target.value }))
              }
              placeholder="value"
              className="flex-1"
            />
            <Button type="submit" size="sm" className="px-3">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Token badges display */}
        <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
          {Object.keys(tokens).length === 0 ? (
            <div className="w-full text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-3 opacity-50">🏷️</div>
              <div>No tokens configured yet</div>
            </div>
          ) : (
            Object.entries(tokens).map(([key, token]) => (
              <Popover key={key}>
                <PopoverTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="group relative cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1"
                  >
                    <span className="font-mono text-sm">{key}</span>
                    <AlertDialog
                      open={deleteDialogOpen === key}
                      onOpenChange={(open) =>
                        setDeleteDialogOpen(open ? key : null)
                      }
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Token</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the '{key}' token?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteToken(key)}
                            className="bg-destructive"
                          >
                            Delete Token
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <div>
                      <div className="font-semibold text-sm">Token Key</div>
                      <div className="font-mono text-sm text-muted-foreground">
                        {key}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Value</div>
                      <div className="font-mono text-sm text-muted-foreground break-all">
                        {(token as any).value}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
