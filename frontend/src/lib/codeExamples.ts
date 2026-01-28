export interface CodeExample {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'nested-loop',
    name: 'Nested Loop',
    description: 'Simple nested for loop example',
    code: `package main

import "fmt"

func main() {
	// Simple nested loop example
	for i := 0; i < 3; i++ {
		for j := 0; j < 2; j++ {
			fmt.Println(i, j)
		}
	}
}
`,
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    description: 'Classic bubble sort algorithm',
    code: `package main

import "fmt"

func main() {
	arr := []int{5, 2, 8, 1, 9}
	n := 5
	
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if arr[j] > arr[j+1] {
				// Swap
				temp := arr[j]
				arr[j] = arr[j+1]
				arr[j+1] = temp
			}
		}
	}
	
	fmt.Println("Sorted:", arr)
}
`,
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    description: 'Generate Fibonacci sequence',
    code: `package main

import "fmt"

func main() {
	n := 10
	a := 0
	b := 1
	
	fmt.Println(a)
	fmt.Println(b)
	
	for i := 2; i < n; i++ {
		c := a + b
		fmt.Println(c)
		a = b
		b = c
	}
}
`,
  },
  {
    id: 'factorial',
    name: 'Factorial',
    description: 'Calculate factorial iteratively',
    code: `package main

import "fmt"

func main() {
	n := 5
	result := 1
	
	for i := 1; i <= n; i++ {
		result = result * i
		fmt.Println(i, "! =", result)
	}
}
`,
  },
  {
    id: 'prime-check',
    name: 'Prime Number',
    description: 'Check if a number is prime',
    code: `package main

import "fmt"

func main() {
	num := 17
	isPrime := true
	
	if num < 2 {
		isPrime = false
	}
	
	for i := 2; i*i <= num; i++ {
		if num%i == 0 {
			isPrime = false
		}
	}
	
	if isPrime {
		fmt.Println(num, "is prime")
	} else {
		fmt.Println(num, "is not prime")
	}
}
`,
  },
  {
    id: 'sum-digits',
    name: 'Sum of Digits',
    description: 'Calculate sum of digits in a number',
    code: `package main

import "fmt"

func main() {
	num := 12345
	sum := 0
	original := num
	
	for num > 0 {
		digit := num % 10
		sum = sum + digit
		num = num / 10
		fmt.Println("Digit:", digit, "Sum:", sum)
	}
	
	fmt.Println("Sum of digits of", original, "is", sum)
}
`,
  },
  {
    id: 'countdown',
    name: 'Countdown',
    description: 'Simple countdown loop',
    code: `package main

import "fmt"

func main() {
	for i := 10; i >= 0; i-- {
		if i == 0 {
			fmt.Println("Liftoff!")
		} else {
			fmt.Println(i)
		}
	}
}
`,
  },
  {
    id: 'multiplication-table',
    name: 'Multiplication Table',
    description: '5x5 multiplication table',
    code: `package main

import "fmt"

func main() {
	size := 5

	for i := 1; i <= size; i++ {
		for j := 1; j <= size; j++ {
			product := i * j
			fmt.Print(product, " ")
		}
		fmt.Println()
	}
}
`,
  },
  {
    id: 'recursive-factorial',
    name: 'Recursive Factorial',
    description: 'Calculate factorial using recursive function calls',
    code: `package main

import "fmt"

func factorial(n int) int {
	if n <= 1 {
		return 1
	}
	result := n * factorial(n-1)
	return result
}

func main() {
	num := 5
	result := factorial(num)
	fmt.Println("Factorial of", num, "is", result)
}
`,
  },
  {
    id: 'helper-functions',
    name: 'Helper Functions',
    description: 'Program using add and multiply helper functions',
    code: `package main

import "fmt"

func add(a int, b int) int {
	sum := a + b
	return sum
}

func multiply(a int, b int) int {
	product := a * b
	return product
}

func main() {
	x := 3
	y := 4
	sum := add(x, y)
	fmt.Println("Sum:", sum)
	product := multiply(x, y)
	fmt.Println("Product:", product)
	combined := add(sum, product)
	fmt.Println("Combined:", combined)
}
`,
  },
  {
    id: 'word-frequency',
    name: 'Word Frequency (Map)',
    description: 'Count frequency of numbers using maps and range',
    code: `package main

import "fmt"

func main() {
	data := []int{3, 1, 4, 1, 5, 9, 2, 6, 5, 3}
	counts := make(map[int]int)

	for _, v := range data {
		counts[v]++
	}

	fmt.Println("Counts:", counts)

	for key, val := range counts {
		if val > 1 {
			fmt.Println(key, "appears", val, "times")
		}
	}
}
`,
  },
  {
    id: 'slice-operations',
    name: 'Slice Operations',
    description: 'Build a slice using append and iterate with range',
    code: `package main

import "fmt"

func main() {
	nums := []int{10, 20, 30}
	nums = append(nums, 40)
	nums = append(nums, 50)

	sum := 0
	for i, v := range nums {
		fmt.Println("Index:", i, "Value:", v)
		sum = sum + v
	}

	fmt.Println("Total:", sum)
}
`,
  },
  {
    id: 'switch-grade',
    name: 'Grade Calculator (Switch)',
    description: 'Assign letter grades using switch statement',
    code: `package main

import "fmt"

func main() {
	score := 85
	grade := ""

	switch {
	case score >= 90:
		grade = "A"
	case score >= 80:
		grade = "B"
	case score >= 70:
		grade = "C"
	case score >= 60:
		grade = "D"
	default:
		grade = "F"
	}

	fmt.Println("Score:", score, "Grade:", grade)
}
`,
  },
  {
    id: 'switch-day',
    name: 'Day Type (Switch)',
    description: 'Categorize days using expression switch',
    code: `package main

import "fmt"

func main() {
	day := 3

	switch day {
	case 1:
		fmt.Println("Monday")
	case 2:
		fmt.Println("Tuesday")
	case 3:
		fmt.Println("Wednesday")
	case 4:
		fmt.Println("Thursday")
	case 5:
		fmt.Println("Friday")
	default:
		fmt.Println("Weekend")
	}
}
`,
  },
  {
    id: 'break-continue',
    name: 'Break & Continue',
    description: 'Skip even numbers and stop at 8 using break and continue',
    code: `package main

import "fmt"

func main() {
	for i := 1; i <= 10; i++ {
		if i == 8 {
			fmt.Println("Stopping at", i)
			break
		}
		if i%2 == 0 {
			continue
		}
		fmt.Println(i)
	}
}
`,
  },
];
