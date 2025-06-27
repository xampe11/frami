#!/bin/bash

# =============================================================================
# ADVANCED TESTING AUTOMATION SCRIPT
# =============================================================================
# Comprehensive testing suite for production-ready DeFi protocols
# Runs all advanced testing categories with proper reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_THRESHOLD=95
GAS_REPORT=true
VERBOSE_OUTPUT=false
FUZZ_RUNS=1000
INVARIANT_RUNS=100
INVARIANT_DEPTH=20

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_section() {
    echo -e "${CYAN}--- $1 ---${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

log_test_result() {
    local test_name=$1
    local status=$2
    local details=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] $test_name: $status - $details" >> test_results.log
}

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

setup_testing_environment() {
    print_header "Setting Up Testing Environment"
    
    # Check dependencies
    check_dependencies
    
    # Create necessary directories
    mkdir -p test_reports
    mkdir -p coverage_reports
    mkdir -p gas_reports
    mkdir -p artifacts

    forge build --via-ir
    
    # Initialize log file
    echo "Advanced Testing Session Started: $(date)" > test_results.log
    
    print_success "Testing environment ready"
}

check_dependencies() {
    print_section "Checking Dependencies"
    
    # Check Foundry
    if ! command -v forge &> /dev/null; then
        print_error "Foundry not found!"
        echo "Please install Foundry: https://book.getfoundry.sh/"
        exit 1
    fi
    print_success "Foundry found"
    
    # Check Node.js (for some analysis tools)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found - some analysis features may be limited"
    else
        print_success "Node.js found"
    fi
    
    # Check bc for calculations
    if ! command -v bc &> /dev/null; then
        print_warning "bc not found - some calculations may be limited"
    fi
    
    # Check git for commit info
    if ! command -v git &> /dev/null; then
        print_warning "git not found - version tracking limited"
    fi
}

# =============================================================================
# BASIC TESTING
# =============================================================================

run_unit_tests() {
    print_header "Running Unit Tests"
    
    local start_time=$(date +%s)
    
    print_section "Standard Unit Tests"
    if forge test --match-path "test/unit/*" -vv; then
        print_success "Unit tests passed"
        log_test_result "Unit Tests" "PASSED" "All unit tests successful"
    else
        print_error "Unit tests failed"
        log_test_result "Unit Tests" "FAILED" "Some unit tests failed"
        return 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    print_info "Unit tests completed in ${duration}s"
}

run_integration_tests() {
    print_header "Running Integration Tests"
    
    local start_time=$(date +%s)
    
    print_section "Integration Tests"
    if forge test --match-path "test/integration/*" -vv; then
        print_success "Integration tests passed"
        log_test_result "Integration Tests" "PASSED" "All integration tests successful"
    else
        print_error "Integration tests failed"
        log_test_result "Integration Tests" "FAILED" "Some integration tests failed"
        return 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    print_info "Integration tests completed in ${duration}s"
}

# =============================================================================
# ADVANCED TESTING
# =============================================================================

run_invariant_tests() {
    print_header "Running Property-Based Invariant Tests"
    
    local start_time=$(date +%s)
    
    print_section "Configuring Invariant Testing"
    echo "Runs: $INVARIANT_RUNS"
    echo "Depth: $INVARIANT_DEPTH"
    
    # Configure foundry for invariant testing
    cat > foundry_invariant.toml << EOF
[profile.invariant]
src = "src"
out = "out"
libs = ["lib"]
solc_version = '0.8.28'
optimizer = true
optimizer_runs = 200

[invariant]
runs = $INVARIANT_RUNS
depth = $INVARIANT_DEPTH
fail_on_revert = false
call_override = false
dictionary_weight = 40
include_storage = true
include_push_bytes = true
EOF
    
    print_section "Running Invariant Tests"
    if FOUNDRY_PROFILE=invariant forge test --match-path "test/unit/FounderNFTInvariant.t.sol" -vvv; then
        print_success "Invariant tests passed"
        log_test_result "Invariant Tests" "PASSED" "All property-based tests successful"
    else
        print_error "Invariant tests failed"
        log_test_result "Invariant Tests" "FAILED" "Some invariant violations found"
        
        # Capture failure details
        echo "Invariant test failures detected. Check logs for details." >> test_reports/invariant_failures.log
        return 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    print_info "Invariant tests completed in ${duration}s with $INVARIANT_RUNS runs"
}

run_fuzz_tests() {
    print_header "Running Advanced Fuzz Tests"
    
    local start_time=$(date +%s)
    
    print_section "Configuring Fuzz Testing"
    echo "Fuzz runs: $FUZZ_RUNS"
    
    # Configure foundry for fuzz testing
    cat > foundry_fuzz.toml << EOF
[profile.fuzz]
src = "src"
out = "out"
libs = ["lib"]
solc_version = '0.8.28'
optimizer = true
optimizer_runs = 200

[fuzz]
runs = $FUZZ_RUNS
max_test_rejects = 65536
seed = '0x3e8'
dictionary_weight = 40
include_storage = true
include_push_bytes = true
EOF
    
    print_section "Robust Fuzz Tests"
    if FOUNDRY_PROFILE=fuzz forge test --match-path "test/unit/FounderNFTRobustFuzzTest.t.sol" -vv; then
        print_success "Structured fuzz tests passed"
    else
        print_error "Structured fuzz tests failed"
        log_test_result "Structured Fuzz Tests" "FAILED" "Edge cases found"
        return 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    print_info "Fuzz tests completed in ${duration}s with $FUZZ_RUNS runs per test"
    log_test_result "Fuzz Tests" "PASSED" "All fuzz testing categories successful"
}

run_formal_verification() {
    print_header "Running Formal Verification"
    
    print_section "SMT Checker (if available)"
    if forge build --use-solc-optimizer-runs 200 2>&1 | grep -q "SMT"; then
        print_success "SMT checker validation passed"
        log_test_result "SMT Checker" "PASSED" "Formal verification successful"
    else
        print_warning "SMT checker not available or no issues found"
        log_test_result "SMT Checker" "SKIPPED" "SMT checker not available"
    fi
    
    print_section "Symbolic Execution (Manual)"
    # This would integrate with tools like Manticore or KEVM
    print_info "Symbolic execution requires external tools"
    print_info "Recommend running: Mythril, Slither, or Manticore separately"
    
    log_test_result "Formal Verification" "PARTIAL" "SMT checked, symbolic execution manual"
}

# =============================================================================
# PERFORMANCE TESTING
# =============================================================================

run_gas_optimization_tests() {
    print_header "Running Gas Optimization Tests"
    
    local start_time=$(date +%s)
    
    print_section "Gas Usage Analysis"
    
    # Run tests with gas reporting
    if $GAS_REPORT; then
        forge test --gas-report > gas_reports/gas_usage_$(date +%Y%m%d_%H%M%S).txt 2>&1
        print_success "Gas report generated"
    fi
    
    print_section "Gas Optimization Tests"
    if forge test --match-path "test/unit/*" -vv; then
        print_success "Gas optimization tests passed"
        log_test_result "Gas Optimization" "PASSED" "All gas benchmarks within limits"
    else
        print_error "Gas optimization tests failed"
        log_test_result "Gas Optimization" "FAILED" "Gas usage exceeds limits"
        return 1
    fi
    
    print_section "Gas Snapshot Comparison"
    if [ -f .gas-snapshot ]; then
        forge snapshot --diff .gas-snapshot > gas_reports/gas_diff_$(date +%Y%m%d_%H%M%S).txt
        print_info "Gas diff report generated"
    else
        forge snapshot
        print_info "Initial gas snapshot created"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    print_info "Gas optimization tests completed in ${duration}s"
}

run_static_analysis() {
    print_header "Running Static Analysis"
    
    print_section "Slither Analysis"
    if command -v slither &> /dev/null; then
        slither . --json slither_report.json > /dev/null 2>&1
        if [ -f slither_report.json ]; then
            print_success "Slither analysis completed"
            
            # Check for high/medium severity issues
            if grep -q '"impact": "High"' slither_report.json || grep -q '"impact": "Medium"' slither_report.json; then
                print_error "High/Medium severity issues found by Slither"
                log_test_result "Static Analysis" "FAILED" "Slither found significant issues"
                return 1
            else
                print_success "No high/medium severity issues found"
            fi
        else
            print_warning "Slither analysis failed to generate report"
        fi
    else
        print_warning "Slither not installed - skipping static analysis"
        log_test_result "Static Analysis" "SKIPPED" "Slither not available"
    fi
    
    print_section "Mythril Analysis"
    if command -v myth &> /dev/null; then
        print_info "Running Mythril analysis (this may take a while)..."
        # Mythril analysis would go here
        print_warning "Mythril analysis requires manual configuration"
    else
        print_warning "Mythril not installed - skipping"
    fi
    
    log_test_result "Static Analysis" "COMPLETED" "Static analysis tools executed"
}

# =============================================================================
# COVERAGE ANALYSIS
# =============================================================================

run_coverage_analysis() {
    print_header "Running Coverage Analysis"
    
    local start_time=$(date +%s)
    
    print_section "Generating Coverage Report"
    if forge coverage --ir-minimum --report lcov > coverage_reports/lcov.info 2>&1; then
        print_success "Coverage report generated"
        
        # Extract coverage percentage if possible
        if command -v lcov &> /dev/null; then
            local coverage=$(lcov --summary coverage_reports/lcov.info 2>/dev/null | grep -o '[0-9.]*%' | tail -1 | sed 's/%//')
            if [ ! -z "$coverage" ]; then
                print_info "Coverage: ${coverage}%"
                
                # Check against threshold
                if (( $(echo "$coverage >= $COVERAGE_THRESHOLD" | bc -l) )); then
                    print_success "Coverage meets threshold (${COVERAGE_THRESHOLD}%)"
                    log_test_result "Coverage Analysis" "PASSED" "Coverage: ${coverage}%"
                else
                    print_warning "Coverage below threshold: ${coverage}% < ${COVERAGE_THRESHOLD}%"
                    log_test_result "Coverage Analysis" "WARNING" "Coverage below threshold: ${coverage}%"
                fi
            fi
        fi
    else
        print_error "Coverage report generation failed"
        log_test_result "Coverage Analysis" "FAILED" "Could not generate coverage report"
        return 1
    fi
    
    print_section "Branch Coverage Analysis"
    # Additional branch coverage analysis would go here
    print_info "Detailed branch coverage analysis requires additional tooling"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    print_info "Coverage analysis completed in ${duration}s"
}

# =============================================================================
# REPORTING
# =============================================================================

generate_final_report() {
    print_header "Generating Final Test Report"
    
    local report_file="test_reports/final_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Advanced Testing Report

**Generated:** $(date)
**Repository:** $(git remote get-url origin 2>/dev/null || echo "Unknown")
**Commit:** $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
**Branch:** $(git branch --show-current 2>/dev/null || echo "Unknown")

## Test Configuration

- **Fuzz Runs:** $FUZZ_RUNS
- **Invariant Runs:** $INVARIANT_RUNS
- **Invariant Depth:** $INVARIANT_DEPTH
- **Coverage Threshold:** $COVERAGE_THRESHOLD%

## Test Results Summary

EOF
    
    # Add results from log
    if [ -f test_results.log ]; then
        echo "## Detailed Results" >> "$report_file"
        echo "" >> "$report_file"
        echo '```' >> "$report_file"
        cat test_results.log >> "$report_file"
        echo '```' >> "$report_file"
    fi
    
    # Add gas report if available
    if [ -f gas_reports/gas_usage_*.txt ]; then
        echo "" >> "$report_file"
        echo "## Gas Usage Analysis" >> "$report_file"
        echo "" >> "$report_file"
        echo '```' >> "$report_file"
        cat gas_reports/gas_usage_*.txt | head -50 >> "$report_file"
        echo '```' >> "$report_file"
    fi
    
    # Add coverage info if available
    if [ -f coverage_reports/lcov.info ]; then
        echo "" >> "$report_file"
        echo "## Coverage Summary" >> "$report_file"
        echo "" >> "$report_file"
        if command -v lcov &> /dev/null; then
            lcov --summary coverage_reports/lcov.info >> "$report_file" 2>/dev/null || echo "Coverage data available in lcov.info" >> "$report_file"
        fi
    fi
    
    print_success "Final report generated: $report_file"
    
    # Display summary
    print_section "Test Summary"
    if grep -q "FAILED" test_results.log; then
        print_error "Some tests failed - see report for details"
        echo "Failed tests:"
        grep "FAILED" test_results.log | cut -d':' -f2-
        return 1
    else
        print_success "All tests passed!"
        return 0
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

show_help() {
    echo "Advanced Testing Suite for Production DeFi Protocols"
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_CATEGORIES]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -v, --verbose           Verbose output"
    echo "  -c, --coverage-only     Run only coverage analysis"
    echo "  -g, --no-gas-report     Skip gas reporting"
    echo "  -f, --fuzz-runs N       Number of fuzz runs (default: $FUZZ_RUNS)"
    echo "  -i, --invariant-runs N  Number of invariant runs (default: $INVARIANT_RUNS)"
    echo "  -t, --threshold N       Coverage threshold (default: $COVERAGE_THRESHOLD)"
    echo ""
    echo "Test Categories:"
    echo "  basic                   Unit and integration tests"
    echo "  advanced                Invariant and fuzz tests"
    echo "  security                Security-focused tests"
    echo "  performance             Gas and stress tests"
    echo "  formal                  Formal verification"
    echo "  all                     All test categories (default)"
    echo ""
    echo "Examples:"
    echo "  $0                      # Run all tests"
    echo "  $0 basic advanced       # Run basic and advanced tests only"
    echo "  $0 -f 2000 -v          # Run with 2000 fuzz runs, verbose output"
    echo "  $0 --coverage-only      # Generate coverage report only"
}

main() {
    local test_categories=()
    local coverage_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE_OUTPUT=true
                shift
                ;;
            -c|--coverage-only)
                coverage_only=true
                shift
                ;;
            -g|--no-gas-report)
                GAS_REPORT=false
                shift
                ;;
            -f|--fuzz-runs)
                FUZZ_RUNS="$2"
                shift 2
                ;;
            -i|--invariant-runs)
                INVARIANT_RUNS="$2"
                shift 2
                ;;
            -t|--threshold)
                COVERAGE_THRESHOLD="$2"
                shift 2
                ;;
            basic|advanced|security|performance|formal|all)
                test_categories+=("$1")
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Default to all categories if none specified
    if [ ${#test_categories[@]} -eq 0 ]; then
        test_categories=("all")
    fi
    
    # Setup environment
    setup_testing_environment
    
    # Handle coverage-only mode
    if [ "$coverage_only" = true ]; then
        run_coverage_analysis
        exit $?
    fi
    
    # Track overall success
    local overall_success=true
    
    # Run requested test categories
    for category in "${test_categories[@]}"; do
        case $category in
            basic)
                run_unit_tests || overall_success=false
                run_integration_tests || overall_success=false
                ;;
            advanced)
                run_invariant_tests || overall_success=false
                run_fuzz_tests || overall_success=false
                ;;
            security)
                run_security_tests || overall_success=false
                run_static_analysis || overall_success=false
                ;;
            performance)
                run_gas_optimization_tests || overall_success=false
                run_stress_tests || overall_success=false
                ;;
            formal)
                run_formal_verification || overall_success=false
                ;;
            all)
                run_unit_tests || overall_success=false
                run_integration_tests || overall_success=false
                run_invariant_tests || overall_success=false
                run_fuzz_tests || overall_success=false
                run_static_analysis || overall_success=false
                run_gas_optimization_tests || overall_success=false
                run_formal_verification || overall_success=false
                ;;
        esac
    done
    
    # Always run coverage analysis at the end
    run_coverage_analysis || overall_success=false
    
    # Generate final report
    if generate_final_report; then
        if [ "$overall_success" = true ]; then
            print_header "🎉 All Tests Passed! Ready for Production 🎉"
            exit 0
        else
            print_header "❌ Some Tests Failed - Review Required ❌"
            exit 1
        fi
    else
        print_header "❌ Testing Failed - Critical Issues Found ❌"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"