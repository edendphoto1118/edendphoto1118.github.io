Option Explicit
Dim shell, files, scriptDir, repoDir, nodePath, command, result
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
scriptDir = files.GetParentFolderName(WScript.ScriptFullName)
repoDir = files.GetParentFolderName(scriptDir)
nodePath = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
If Not files.FileExists(nodePath) Then nodePath = "node"
shell.CurrentDirectory = repoDir
command = Chr(34) & nodePath & Chr(34) & " " & Chr(34) & scriptDir & "\watch-magazines.js" & Chr(34)
result = shell.Run(command, 0, True)
WScript.Quit result
