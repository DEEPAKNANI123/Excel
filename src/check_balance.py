import sys

def check_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    line_num = 1
    char_pos = 1
    
    for i, char in enumerate(content):
        if char == '\n':
            line_num += 1
            char_pos = 1
            continue
        
        if char == '{':
            stack.append(('{', line_num, char_pos))
        elif char == '}':
            if not stack:
                print(f"Extra '}}' found at line {line_num}, col {char_pos}")
                return False
            stack.pop()
        
        char_pos += 1
    
    if stack:
        for s in stack:
            print(f"Unclosed '{s[0]}' opened at line {s[1]}, col {s[2]}")
        return False
    
    print("Brackets are balanced!")
    return True

if __name__ == "__main__":
    check_balance(sys.argv[1])
