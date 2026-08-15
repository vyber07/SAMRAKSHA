import os
import re
import glob

import libcst as cst
from libcst import matchers as m

class DBRefactorTransformer(cst.CSTTransformer):
    def leave_ImportFrom(self, original_node, updated_node):
        if updated_node.module and updated_node.module.value == 'app.db.connection':
            new_names = []
            for name in updated_node.names:
                if name.name.value not in ('fetch_all', 'fetch_one', 'execute', 'convert_query'):
                    new_names.append(name)
            if not new_names:
                return cst.RemoveFromParent()
            return updated_node.with_changes(names=new_names)
        return updated_node
        
    def leave_Module(self, original_node, updated_node):
        # Add 'from sqlalchemy import text' if we need it (assume we do if we modified something)
        # Actually we can just add it blindly and ruff will clean it up later, but let's be careful.
        imports = [n for n in updated_node.body if isinstance(n, cst.SimpleStatementLine) and isinstance(n.body[0], (cst.Import, cst.ImportFrom))]
        if imports:
            new_import = cst.parse_statement("from sqlalchemy import text\n")
            new_body = list(updated_node.body)
            new_body.insert(new_body.index(imports[0]), new_import)
            return updated_node.with_changes(body=new_body)
        return updated_node

    def leave_Await(self, original_node, updated_node):
        call = updated_node.expression
        if isinstance(call, cst.Call) and isinstance(call.func, cst.Name):
            func_name = call.func.value
            if func_name in ('fetch_all', 'fetch_one', 'execute'):
                # Args: db, query, [params]
                args = call.args
                if len(args) >= 2:
                    db_arg = args[0].value
                    query_arg = args[1].value
                    
                    params_arg = None
                    if len(args) >= 3:
                        params_arg = args[2].value
                    
                    # Convert list to dict if it's a List
                    param_dict_str = "None"
                    if params_arg:
                        if isinstance(params_arg, cst.List):
                            dict_items = []
                            for i, elem in enumerate(params_arg.elements):
                                dict_items.append(f"'p{i+1}': {cst.Module([]).code_for_node(elem.value)}")
                            param_dict_str = "{" + ", ".join(dict_items) + "}"
                        elif isinstance(params_arg, cst.Name):
                            # It's a dynamic list like `params`, we can't statically convert it to dict.
                            # We will convert it at runtime: {f'p{i+1}': v for i, v in enumerate(params)}
                            param_dict_str = f"{{f'p{{i+1}}': v for i, v in enumerate({params_arg.value})}}"
                        else:
                            param_dict_str = f"{{f'p{{i+1}}': v for i, v in enumerate({cst.Module([]).code_for_node(params_arg)})}}"
                    else:
                        param_dict_str = "{}"
                        
                    # Now rewrite the call to db.execute(text(query), params)
                    if func_name == 'execute':
                        new_code = f"await {cst.Module([]).code_for_node(db_arg)}.execute(text({cst.Module([]).code_for_node(query_arg)}), {param_dict_str})"
                    elif func_name == 'fetch_one':
                        new_code = f"(await {cst.Module([]).code_for_node(db_arg)}.execute(text({cst.Module([]).code_for_node(query_arg)}), {param_dict_str})).mappings().fetchone()"
                    elif func_name == 'fetch_all':
                        new_code = f"(await {cst.Module([]).code_for_node(db_arg)}.execute(text({cst.Module([]).code_for_node(query_arg)}), {param_dict_str})).mappings().fetchall()"
                        
                    try:
                        new_node = cst.parse_expression(new_code)
                        # We must preserve the await inside the new_node, so we return new_node directly 
                        # instead of updated_node.with_changes since new_node might contain the await.
                        return new_node
                    except Exception as e:
                        print(f"Error parsing {new_code}: {e}")
                        
        return updated_node

    def leave_SimpleString(self, original_node, updated_node):
        # Replace $1 with :p1 in string literals
        new_val = re.sub(r'\$(\d+)', r':p\1', updated_node.value)
        if new_val != updated_node.value:
            return updated_node.with_changes(value=new_val)
        return updated_node
        
    def leave_FormattedString(self, original_node, updated_node):
        # F-strings are tricky, but we can just replace $1 with :p1 in the text parts
        new_parts = []
        changed = False
        for part in updated_node.parts:
            if isinstance(part, cst.FormattedStringText):
                new_val = re.sub(r'\$(\d+)', r':p\1', part.value)
                if new_val != part.value:
                    new_parts.append(part.with_changes(value=new_val))
                    changed = True
                else:
                    new_parts.append(part)
            else:
                new_parts.append(part)
        if changed:
            return updated_node.with_changes(parts=new_parts)
        return updated_node

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        src = f.read()
    
    try:
        tree = cst.parse_module(src)
    except Exception as e:
        print(f"Failed to parse {filepath}: {e}")
        return
        
    transformer = DBRefactorTransformer()
    modified_tree = tree.visit(transformer)
    
    with open(filepath, 'w') as f:
        f.write(modified_tree.code)
    print(f"Refactored {filepath}")

def main():
    files = glob.glob("backend/app/api/*.py") + glob.glob("backend/app/services/*.py")
    for f in files:
        with open(f, 'r') as fh:
            content = fh.read()
        if 'fetch_all' in content or 'fetch_one' in content or 'execute' in content or 'convert_query' in content:
            refactor_file(f)
            
    # Finally, remove them from connection.py
    connection_path = "backend/app/db/connection.py"
    with open(connection_path, 'r') as f:
        content = f.read()
        
    # We will strip out convert_query, execute, fetch_all, fetch_one using regex 
    # since it's easier to just snip them out.
    content = re.sub(r'def convert_query.*?async def execute', 'async def execute', content, flags=re.DOTALL)
    # Actually just cut everything from `def convert_query` to the end of the file!
    content = re.sub(r'def convert_query.*', '', content, flags=re.DOTALL)
    
    with open(connection_path, 'w') as f:
        f.write(content)
    print("Cleaned up connection.py")

if __name__ == "__main__":
    main()
